/**
 * Minimal GitHub OAuth proxy for /cms/ (Decap-compatible /auth and /callback routes).
 * Deploy on Render as a Node Web Service; set env vars in Render dashboard.
 */
require("dotenv").config();
const express = require("express");

const CLIENT_ID = process.env.OAUTH_GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.OAUTH_GITHUB_CLIENT_SECRET || process.env.GITHUB_CLIENT_SECRET;
const PORT = Number(process.env.PORT) || 3000;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing OAuth credentials on Render Environment tab:");
  console.error("  OAUTH_GITHUB_CLIENT_ID set:", Boolean(process.env.OAUTH_GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID));
  console.error("  OAUTH_GITHUB_CLIENT_SECRET set:", Boolean(process.env.OAUTH_GITHUB_CLIENT_SECRET || process.env.GITHUB_CLIENT_SECRET));
  console.error('Keys must be exactly OAUTH_GITHUB_CLIENT_ID and OAUTH_GITHUB_CLIENT_SECRET (not your Client ID in the KEY field).');
  process.exit(1);
}

const app = express();

app.get("/", (_req, res) => {
  res.type("text/plain").send("Portfolio CMS OAuth proxy is running.");
});

app.get("/auth", (req, res) => {
  const redirectUri = req.query.redirect_uri;
  if (!redirectUri) {
    res.status(400).send("Missing redirect_uri");
    return;
  }
  const scope = req.query.scope || "repo";
  const clientId = req.query.client_id || CLIENT_ID;
  const state = Buffer.from(String(redirectUri)).toString("base64url");
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", `${getPublicOrigin(req)}/callback`);
  url.searchParams.set("scope", scope);
  url.searchParams.set("state", state);
  res.redirect(url.toString());
});

app.get("/callback", async (req, res) => {
  const { code, state, error } = req.query;
  if (error) {
    res.status(400).send(`GitHub OAuth error: ${error}`);
    return;
  }
  if (!code || !state) {
    res.status(400).send("Missing code or state");
    return;
  }
  let redirectUri;
  try {
    redirectUri = Buffer.from(String(state), "base64url").toString("utf8");
  } catch {
    res.status(400).send("Invalid state");
    return;
  }
  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: `${getPublicOrigin(req)}/callback`,
      }),
    });
    const data = await tokenRes.json();
    if (data.error) {
      res.status(400).send(`Token error: ${data.error_description || data.error}`);
      return;
    }
    const sep = redirectUri.includes("#") ? "&" : "#";
    res.redirect(`${redirectUri}${sep}access_token=${encodeURIComponent(data.access_token)}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("OAuth token exchange failed");
  }
});

function getPublicOrigin(req) {
  const proto = req.get("x-forwarded-proto") || req.protocol;
  const host = req.get("x-forwarded-host") || req.get("host");
  return `${proto}://${host}`;
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`OAuth proxy listening on port ${PORT}`);
});
