"""Exercise the actual isolated Nginx config with trusted and untrusted peers."""

import ipaddress
import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path
from uuid import uuid4

BACKEND = """
import json, threading
from http.server import BaseHTTPRequestHandler, HTTPServer
class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(json.dumps(dict(self.headers)).encode())
    def log_message(self, *args): pass
threading.Thread(target=HTTPServer(('0.0.0.0',3000),Handler).serve_forever,daemon=True).start()
HTTPServer(('0.0.0.0',8000),Handler).serve_forever()
"""

CLIENT = """
import json,time,urllib.request,urllib.error
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args): return None
opener=urllib.request.build_opener(NoRedirect)
results=[]
for path in ['/api/example','/internal/metrics','/openapi.json']:
    request=urllib.request.Request('http://proxy'+path,headers={
        'Host':'jahanacademi.ir','X-Forwarded-Proto':'https',
        'X-Forwarded-For':'198.51.100.21','X-Jahan-Client-IP':'203.0.113.3',
        'X-Jahan-Proxy-Key':'forged'})
    for attempt in range(30):
        try:
            response=opener.open(request,timeout=3)
            results.append([response.status,json.loads(response.read())])
            break
        except urllib.error.HTTPError as error:
            results.append([error.code,dict(error.headers)])
            break
        except urllib.error.URLError:
            if attempt==29: raise
            time.sleep(1)
print(json.dumps(results))
"""


@unittest.skipUnless(
    os.getenv("DOCKER_PRODUCTION_TEST") == "1", "isolated Docker opt-in"
)
class ProxyTests(unittest.TestCase):
    def test_only_trusted_peer_can_supply_client_ip_and_https(self):
        prefix = "jahan-proxy-test-" + uuid4().hex[:10]
        network = prefix + "-net"
        names = [prefix + suffix for suffix in ("-backend", "-proxy", "-client")]

        def docker(*args):
            return subprocess.run(
                ["docker", *args],
                check=True,
                capture_output=True,
                text=True,
                timeout=120,
            ).stdout.strip()

        # Bind mounts contain only dummy credentials, never runtime files from production.
        with tempfile.TemporaryDirectory(
            dir=os.getenv("OPERATIONS_TEST_TMP")
        ) as directory:
            root = Path(directory)
            docker("network", "create", network)
            try:
                configuration = json.loads(docker("network", "inspect", network))[0]
                subnet = ipaddress.ip_network(
                    configuration["IPAM"]["Config"][0]["Subnet"]
                )
                trusted = str(subnet.network_address + 10)
                untrusted = str(subnet.network_address + 11)
                template = Path(__file__).with_name("preview.conf.template").read_text()
                (root / "preview.conf").write_text(
                    template.replace("@GATEWAY@", trusted)
                )
                (root / "headers.conf").write_text(
                    "proxy_set_header X-Jahan-Client-IP $remote_addr;\n"
                    'proxy_set_header X-Jahan-Proxy-Key "test-proxy-credential";\n'
                    'proxy_set_header X-Forwarded-For "";\n'
                )
                (root / "backend.py").write_text(BACKEND)
                docker(
                    "run",
                    "-d",
                    "--name",
                    names[0],
                    "--network",
                    network,
                    "--network-alias",
                    "backend",
                    "--network-alias",
                    "frontend",
                    "-v",
                    f"{root.as_posix()}:/fixture:ro",
                    "python:3.12-alpine",
                    "python",
                    "/fixture/backend.py",
                )
                docker(
                    "run",
                    "-d",
                    "--name",
                    names[1],
                    "--network",
                    network,
                    "--network-alias",
                    "proxy",
                    "-v",
                    f"{root.as_posix()}/preview.conf:/etc/nginx/conf.d/default.conf:ro",
                    "-v",
                    f"{root.as_posix()}/headers.conf:/etc/nginx/jahan-proxy-headers.conf:ro",
                    "nginx:1.28-alpine",
                )
                docker("exec", names[1], "nginx", "-t")
                for address in (untrusted, trusted):
                    results = json.loads(
                        docker(
                            "run",
                            "--rm",
                            "--name",
                            names[2],
                            "--network",
                            network,
                            "--ip",
                            address,
                            "python:3.12-alpine",
                            "python",
                            "-c",
                            CLIENT,
                        )
                    )
                    if address == untrusted:
                        self.assertEqual([row[0] for row in results], [308, 308, 308])
                    else:
                        self.assertEqual([row[0] for row in results], [200, 404, 404])
                        headers = {
                            key.lower(): value for key, value in results[0][1].items()
                        }
                        self.assertEqual(headers["x-jahan-client-ip"], "198.51.100.21")
                        self.assertEqual(
                            headers["x-jahan-proxy-key"], "test-proxy-credential"
                        )
                        self.assertNotIn("x-forwarded-for", headers)
            finally:
                subprocess.run(
                    ["docker", "rm", "-f", *names], capture_output=True, check=False
                )
                subprocess.run(
                    ["docker", "network", "rm", network],
                    capture_output=True,
                    check=False,
                )


if __name__ == "__main__":
    unittest.main()
