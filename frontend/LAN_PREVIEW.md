# Preview from another computer

Run the develop checkout on port 5000. In `frontend/.env.local`, add the server's
exact LAN hostname or IP (without a scheme or port):

```dotenv
JAHAN_DEV_ORIGINS=192.168.8.61
ADMIN_API_URL=http://127.0.0.1:18080
API_INTERNAL_URL=http://127.0.0.1:18080
```

Restart the dev server after changing the environment. Other devices on the same
network should open `http://192.168.8.61:5000/fa`, using the server's current IP.
`localhost` on a different computer points to that computer instead of this server.
Do not put a loopback backend URL in `NEXT_PUBLIC_API_BASE_URL`: browsers use the
same-origin `/api/v1` proxy, and only Next needs direct backend access.

Keep the Windows firewall enabled; if incoming access is blocked, allow only the
preview port on the trusted private network. No direct backend port is needed.

HTTP LAN previews support consultation and assessment submission through the
shared request-key generator. Motion respects the device's reduced-motion setting.
Deploy public sites over HTTPS. Clipboard access may be unavailable on HTTP;
receipts also display the code for manual copying.
