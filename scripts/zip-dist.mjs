/**
 * Zip dist/ for Load unpacked distribution (macOS and Windows).
 */
import { createWriteStream, existsSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import archiver from "archiver";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const distDir = resolve(root, "dist");
const outZip = resolve(root, "drink-good.zip");

if (!existsSync(distDir)) {
  console.error("dist/ not found. Run npm run build first.");
  process.exit(1);
}

/** Collect files under dir; skip source maps. */
function collectFiles(dir, baseDir = dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absolutePath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(absolutePath, baseDir));
    } else if (!absolutePath.endsWith(".map")) {
      files.push({
        absolutePath,
        relativePath: relative(baseDir, absolutePath),
      });
    }
  }
  return files;
}

const files = collectFiles(distDir);
if (files.length === 0) {
  console.error("dist/ is empty.");
  process.exit(1);
}

await new Promise((resolvePromise, reject) => {
  const output = createWriteStream(outZip);
  const archive = archiver("zip", { zlib: { level: 9 } });

  output.on("close", () => {
    console.log(
      `Wrote ${outZip} (${archive.pointer()} bytes, ${files.length} files)`,
    );
    resolvePromise();
  });
  archive.on("error", reject);
  archive.pipe(output);

  for (const { absolutePath, relativePath } of files) {
    archive.file(absolutePath, {
      name: relativePath.split("\\").join("/"),
    });
  }

  archive.finalize();
});
