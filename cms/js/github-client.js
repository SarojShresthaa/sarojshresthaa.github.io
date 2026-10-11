export class GitHubClient {
  constructor(config) {
    this.config = config;
    this.tokenKey = "portfolio_cms_github_token";
  }

  getToken() {
    return sessionStorage.getItem(this.tokenKey);
  }

  setToken(token) {
    if (token) sessionStorage.setItem(this.tokenKey, token);
    else sessionStorage.removeItem(this.tokenKey);
  }

  isAuthenticated() {
    return Boolean(this.getToken());
  }

  login() {
    if (!this.config.oauth_proxy_url || !this.config.github_client_id) {
      throw new Error("OAuth is not configured. Edit cms/config.public.json.");
    }
    const redirect = encodeURIComponent(`${location.origin}/cms/oauth-callback.html`);
    const url = `${this.config.oauth_proxy_url}/auth?provider=github&scope=repo&client_id=${encodeURIComponent(this.config.github_client_id)}&redirect_uri=${redirect}`;
    window.location.href = url;
  }

  async api(path, options = {}) {
    const token = this.getToken();
    if (!token) throw new Error("Not signed in to GitHub.");
    const res = await fetch(`https://api.github.com${path}`, {
      ...options,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(options.headers || {}),
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`GitHub API ${res.status}: ${body}`);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  async getFileSha(repoPath) {
    try {
      const data = await this.api(
        `/repos/${this.config.repo}/contents/${repoPath}?ref=${encodeURIComponent(this.config.branch)}`
      );
      return data.sha;
    } catch {
      return null;
    }
  }

  async putFile(repoPath, contentText, message) {
    const write = async () => {
      const sha = await this.getFileSha(repoPath);
      const body = {
        message,
        content: btoa(unescape(encodeURIComponent(contentText))),
        branch: this.config.branch,
      };
      if (sha) body.sha = sha;
      return this.api(`/repos/${this.config.repo}/contents/${repoPath}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    };
    try {
      return await write();
    } catch (err) {
      if (String(err.message).includes("409")) {
        return await write();
      }
      throw err;
    }
  }

  async putBinaryFile(repoPath, base64Content, message) {
    const sha = await this.getFileSha(repoPath);
    const body = {
      message,
      content: base64Content,
      branch: this.config.branch,
    };
    if (sha) body.sha = sha;
    return this.api(`/repos/${this.config.repo}/contents/${repoPath}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async deleteFile(repoPath, message) {
    const sha = await this.getFileSha(repoPath);
    if (!sha) throw new Error("File not found on GitHub.");
    return this.api(`/repos/${this.config.repo}/contents/${repoPath}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, sha, branch: this.config.branch }),
    });
  }
}

export async function loadCmsConfig() {
  const pub = await fetch("/cms/config.public.json", { cache: "no-cache" });
  if (!pub.ok) throw new Error("Could not load /cms/config.public.json");
  return pub.json();
}

export function isOAuthConfigured(config) {
  return Boolean(config?.oauth_proxy_url && config?.github_client_id && !String(config.oauth_proxy_url).includes("YOUR_") && !String(config.github_client_id).includes("YOUR_"));
}
