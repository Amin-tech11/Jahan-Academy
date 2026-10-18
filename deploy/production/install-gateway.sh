#!/usr/bin/env bash
# Run as the existing administrator. No change to the normal SSH listener or other stacks.
set -euo pipefail
umask 077
root=/opt/jahan-academy-test
input=${1:?Directory containing ssh-gateway.py and deployment-key.pub}
test "$(id -u)" = 0
test -d "$root"
ssh-keygen -lf "$input/deployment-key.pub" >/dev/null
python3 -m py_compile "$input/ssh-gateway.py"
directory="$root/automation"
mkdir -p "$directory" /root/.ssh
chmod 700 "$directory" /root/.ssh
stamp=$(date -u +%Y%m%dT%H%M%SZ)
snapshot="$directory/setup-$stamp"
mkdir -m 700 "$snapshot"
for file in ssh-gateway.py sshd_config; do
  [ ! -f "$directory/$file" ] || cp -p "$directory/$file" "$snapshot/"
done
[ ! -f /root/.ssh/authorized_keys ] || cp -p /root/.ssh/authorized_keys "$snapshot/authorized_keys"
install -m 700 "$input/ssh-gateway.py" "$directory/ssh-gateway.py"
key=$(cat "$input/deployment-key.pub")
line="restrict,command=\"/usr/bin/python3 $directory/ssh-gateway.py\" $key"
touch /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys
if ! grep -qF "$key" /root/.ssh/authorized_keys; then
  printf '%s\n' "$line" >> /root/.ssh/authorized_keys
fi
cat > "$directory/sshd_config" <<'CONFIG'
Port 2222
ListenAddress 0.0.0.0
HostKey /etc/ssh/ssh_host_ed25519_key
PidFile /run/jahan-deploy-sshd.pid
AuthorizedKeysFile /root/.ssh/authorized_keys
PubkeyAuthentication yes
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
AllowUsers root
AllowTcpForwarding no
AllowAgentForwarding no
X11Forwarding no
PermitTunnel no
UsePAM yes
CONFIG
/usr/sbin/sshd -t -f "$directory/sshd_config"
cat > /etc/systemd/system/jahan-deploy-sshd.service <<'UNIT'
[Unit]
Description=Jahan Academy deployment SSH on existing port 2222
After=network.target
[Service]
Type=simple
ExecStartPre=/usr/bin/mkdir -p /run/sshd
ExecStart=/usr/sbin/sshd -D -f /opt/jahan-academy-test/automation/sshd_config
Restart=on-failure
RestartSec=3
[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
# Replace only the user-started temporary listener identified by its exact PID file.
if [ -f /run/sshd-test-2222.pid ]; then
  pid=$(cat /run/sshd-test-2222.pid)
  [[ "$pid" =~ ^[0-9]+$ ]]
  if [ -r "/proc/$pid/cmdline" ]; then
    command=$(tr '\0' ' ' < "/proc/$pid/cmdline")
    [[ "$command" == *sshd* && "$command" == *2222* && "$command" == */run/sshd-test-2222.pid* ]]
    kill "$pid"
  fi
fi
systemctl enable --now jahan-deploy-sshd.service
systemctl is-active --quiet jahan-deploy-sshd.service
printf 'Jahan Academy gateway installed; existing administrator keys preserved. Snapshot: %s\n' "$snapshot"
