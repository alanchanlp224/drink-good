/** Bump patch version in package.json (manifest reads version from there). */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkgPath = path.join(root, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

const parts = pkg.version.split(".").map((part) => Number.parseInt(part, 10));
if (parts.length !== 3 || parts.some((value) => Number.isNaN(value))) {
  throw new Error(`Invalid semver in package.json: ${pkg.version}`);
}

const nextVersion = `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
pkg.version = nextVersion;
fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

const lockPath = path.join(root, "package-lock.json");
if (fs.existsSync(lockPath)) {
  const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
  lock.version = nextVersion;
  if (lock.packages?.[""]) {
    lock.packages[""].version = nextVersion;
  }
  fs.writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
}

console.log(`Bumped version to ${nextVersion}`);
