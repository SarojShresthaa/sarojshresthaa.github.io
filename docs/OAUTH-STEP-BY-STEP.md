# Step-by-step: CMS sign-in (GitHub OAuth + Render)

Your **Client ID** is already in `cms/config.public.json`. Finish these steps in order.

---

## Part 1 — GitHub OAuth app (finish setup)

1. Open [GitHub OAuth Apps](https://github.com/settings/developers) → **saroj cms**.
2. Click **Generate a new client secret** → copy the secret → store in a password manager (shown once).
3. **Leave Redirect URI empty for now** — you will add it in Part 3 after Render gives you a URL.
4. Confirm **Homepage URL** is `https://saroj.dev/`.

---

## Part 2 — Deploy OAuth proxy on Render (Node, from this repo)

Use the **`oauth-proxy/`** folder in this repository (not the Docker image — env vars often fail on image-only deploys).

1. **Push** this repo to GitHub if you have not already (includes `oauth-proxy/`).
2. [render.com](https://render.com) → **New +** → **Web Service** → connect **`SarojShresthaa/sarojshresthaa.github.io`**.
3. Settings:

   | Setting | Value |
   |---------|--------|
   | Name | `saroj-cms-oauth` |
   | Root directory | `oauth-proxy` |
   | Runtime | Node |
   | Build command | `npm install` |
   | Start command | `npm start` |
   | Instance type | Free |

4. **Environment** → add **before** first deploy:

   | Key | Value |
   |-----|--------|
   | `OAUTH_GITHUB_CLIENT_ID` | `Ov23lii35wclPrYpEXGo` |
   | `OAUTH_GITHUB_CLIENT_SECRET` | secret from Part 1 |

5. **Create Web Service** → wait until **Live**.
6. Open `https://YOUR-SERVICE.onrender.com` — you should see: `Portfolio CMS OAuth proxy is running.`

If you already created a **Docker image** service that crashes, delete it and use this Node setup instead.

---

## Part 3 — Fix GitHub Redirect URI

1. Back to [saroj cms OAuth app](https://github.com/settings/developers).
2. **Remove** `https://saroj.dev/` from Redirect URIs if it is still there.
3. **Add** (replace with your Render URL):
   ```text
   https://saroj-cms-oauth.onrender.com/callback
   ```
4. Click **Update application**.

---

## Part 4 — Update portfolio config and deploy

1. In this repo, open `cms/config.public.json`.
2. Set `oauth_proxy_url` to your Render URL:
   ```json
   "oauth_proxy_url": "https://saroj-cms-oauth.onrender.com"
   ```
3. Confirm `github_client_id` is `Ov23lii35wclPrYpEXGo`.
4. Commit and push to **main** on `SarojShresthaa/sarojshresthaa.github.io`.
5. Wait 1–2 minutes for GitHub Pages to rebuild.

---

## Part 5 — Sign in and save in the CMS

1. Open `https://saroj.dev/cms/` (hard refresh: Ctrl+F5).
2. Top bar should say **Not signed in** (not “Sign-in not configured”).
3. Click **Sign in with GitHub** → approve **saroj cms**.
4. You should land back on `/cms/` with **Signed in to GitHub**.
5. Select **Home** (or any node) → edit fields → **Save**.
6. Wait for the green success toast — that means a commit was pushed to GitHub.
7. After Pages rebuilds, check the live site.

**Publish** sets `status` to `published` and saves.

---

## If something fails

| Problem | Fix |
|---------|-----|
| “Sign-in not configured” | `oauth_proxy_url` still has `YOUR_OAUTH` or not pushed |
| GitHub error after login | Redirect URI must be exactly `https://YOUR-RENDER-URL/callback` |
| Save fails with 401 | Sign out and sign in again; check client secret on Render |
| Render sleeps (free tier) | First sign-in after idle can take ~30s — try again |
| No proxy yet | Edit `content/*.json` locally and `git push` — site still updates |

---

## Security

- **Never** commit `OAUTH_GITHUB_CLIENT_SECRET` or put it in `config.public.json`.
- Client ID in `config.public.json` is fine (public).
