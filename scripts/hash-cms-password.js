#!/usr/bin/env node
/** Run: node scripts/hash-cms-password.js "your-password" */
const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-cms-password.js "your-password"');
  process.exit(1);
}
const crypto = require("crypto");
const hash = crypto.createHash("sha256").update(password, "utf8").digest("hex");
console.log("Add to cms/config.public.json → cmsAccess.passwordSha256:");
console.log(hash);
