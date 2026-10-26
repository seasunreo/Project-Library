const fs = require("node:fs");
const path = require("node:path");
const CleanCSS = require("clean-css");
const { minify: minifyHtml } = require("html-minifier-terser");
const { minify: minifyJavaScript } = require("terser");

const projectRoot = path.resolve(__dirname, "..");
const outputDirectory = path.join(projectRoot, "dist");
const deployablePaths = ["index.html", "src", "public", "projects"];

async function minifyFile(filePath) {
  const source = fs.readFileSync(filePath, "utf8");

  if (filePath.endsWith(".html")) {
    const minified = await minifyHtml(source, {
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true,
      removeComments: true,
    });
    fs.writeFileSync(filePath, minified);
    return;
  }

  if (filePath.endsWith(".css")) {
    const result = new CleanCSS().minify(source);
    if (result.errors.length > 0) {
      throw new Error(`Could not minify ${filePath}: ${result.errors.join("; ")}`);
    }
    fs.writeFileSync(filePath, result.styles);
    return;
  }

  if (filePath.endsWith(".js")) {
    const result = await minifyJavaScript(source);
    if (result.code === undefined) {
      throw new Error(`Could not minify ${filePath}`);
    }
    fs.writeFileSync(filePath, result.code);
  }
}

async function minifyDirectory(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await minifyDirectory(entryPath);
    } else if (/\.(html|css|js)$/i.test(entry.name)) {
      await minifyFile(entryPath);
    }
  }
}

async function build() {
  fs.rmSync(outputDirectory, { recursive: true, force: true });
  fs.mkdirSync(outputDirectory, { recursive: true });

  for (const relativePath of deployablePaths) {
    const sourcePath = path.join(projectRoot, relativePath);
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Required deployment file or directory is missing: ${relativePath}`);
    }
    fs.cpSync(sourcePath, path.join(outputDirectory, relativePath), {
      recursive: true,
      filter: (entryPath) => path.basename(entryPath) !== "input.css",
    });
  }

  await minifyDirectory(outputDirectory);
  console.log(`Minified deployment files written to ${outputDirectory}`);
}

build().catch((error) => {
  console.error("Build failed:", error);
  process.exitCode = 1;
});
