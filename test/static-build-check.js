const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const rootFiles = ["script.js", "seed-data.js", "server.js"];
const sourceRoots = [
  "lib",
  path.join("netlify", "functions"),
  "test"
];

function collectJavaScriptFiles(directory) {
  const absoluteDirectory = path.join(rootDir, directory);
  return fs.readdirSync(absoluteDirectory, { withFileTypes: true })
    .flatMap((entry) => {
      const relativePath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return collectJavaScriptFiles(relativePath);
      }

      if (!entry.isFile() || path.extname(entry.name) !== ".js") {
        return [];
      }

      return [relativePath];
    });
}

const files = [
  ...rootFiles,
  ...sourceRoots.flatMap(collectJavaScriptFiles)
].sort();
const failures = [];

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", path.join(rootDir, file)], {
    cwd: rootDir,
    encoding: "utf8"
  });

  if (result.status !== 0) {
    failures.push(`${file}\n${result.stderr || result.stdout}`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Checked ${files.length} JavaScript files.`);
