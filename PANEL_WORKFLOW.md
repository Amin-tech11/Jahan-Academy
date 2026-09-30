# Panel development mapping

| Panel | Chat title | Branch | Local URL | Command from that branch's `frontend` directory |
|---|---|---|---|---|
| Home Page | `home-page:3100` | `home-page` | `http://localhost:3100` | `pnpm dev:home` |
| Dashboard | `dashboard:3101` | `dashboard` | `http://localhost:3101` | `pnpm dev:dashboard` |
| Users | `users:3102` | `users` | `http://localhost:3102` | `pnpm dev:users` |
| Orders | `orders:3103` | `orders` | `http://localhost:3103` | `pnpm dev:orders` |
| Universities | `universities-page:3400` | `universities-page` | `http://localhost:3400` | `pnpm dev:universities` |
| Full-site integration | Separate develop chat/checkout | `develop` | `http://localhost:5000` | `pnpm dev:develop` |

Each command checks that its checkout is on the mapped branch before starting Next.js. Use separate checkouts to run multiple branches at once, because one checkout cannot hold multiple active branches. The dashboard, users, and orders mappings reserve names and ports; they do not assert that those panels or branches already exist.

The current `develop` branch has not yet integrated all panel branches. Port 5000 displays the content actually present on `develop`; making it the complete site requires user-directed integration merges.
