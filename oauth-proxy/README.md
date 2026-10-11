# OAuth proxy (Render)

Deploy this folder as a **Node** Web Service on Render (not Docker).

## Render settings

| Setting | Value |
|---------|--------|
| Repository | `SarojShresthaa/sarojshresthaa.github.io` |
| Root directory | `oauth-proxy` |
| Runtime | Node |
| Build command | `npm install` |
| Start command | `npm start` |

## Environment variables

| Key | Value |
|-----|--------|
| `OAUTH_GITHUB_CLIENT_ID` | Your GitHub OAuth app Client ID |
| `OAUTH_GITHUB_CLIENT_SECRET` | Your GitHub OAuth app client secret |

## GitHub OAuth app

Authorization callback URL:

```text
https://YOUR-RENDER-SERVICE.onrender.com/callback
```

Then set `oauth_proxy_url` in `cms/config.public.json` to `https://YOUR-RENDER-SERVICE.onrender.com`.
