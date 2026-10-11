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

## Environment variables (Production)

In Render → your service → **Environment** → ensure **Production** is selected (not only Preview).

| Key | Value |
|-----|--------|
| `OAUTH_GITHUB_CLIENT_ID` | `Ov23lii35wclPrYpEXGo` |
| `OAUTH_GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret (full string) |

After editing, click **Save, rebuild, and deploy**. Logs must show `OAUTH_GITHUB_CLIENT_ID set: true`.

Repo root `render.yaml` can set the Client ID automatically when using Render Blueprint sync.

## GitHub OAuth app

Authorization callback URL:

```text
https://YOUR-RENDER-SERVICE.onrender.com/callback
```

Then set `oauth_proxy_url` in `cms/config.public.json` to `https://YOUR-RENDER-SERVICE.onrender.com`.
