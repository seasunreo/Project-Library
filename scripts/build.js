const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
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

function buildStylesheet(inputPath, outputPath) {
  const tailwindPackage = require.resolve("@tailwindcss/cli/package.json");
  const tailwindCli = path.join(path.dirname(tailwindPackage), "dist", "index.mjs");
  execFileSync(
    process.execPath,
    [tailwindCli, "-i", inputPath, "-o", outputPath, "--minify"],
    { cwd: projectRoot, stdio: "inherit" },
  );
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

  fs.copyFileSync(
    path.join(outputDirectory, "src", "pages", "library.html"),
    path.join(outputDirectory, "library.html"),
  );

  buildStylesheet(
    path.join(projectRoot, "src", "css", "input.css"),
    path.join(outputDirectory, "src", "css", "output.css"),
  );
  buildStylesheet(
    path.join(projectRoot, "projects", "callmestock", "css", "input.css"),
    path.join(outputDirectory, "projects", "callmestock", "css", "output.css"),
  );

  await minifyDirectory(outputDirectory);
  console.log(`Minified deployment files written to ${outputDirectory}`);
}

build().catch((error) => {
  console.error("Build failed:", error);
  process.exitCode = 1;
});
