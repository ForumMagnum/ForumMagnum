// Build script for the vendored copy of Excalidraw. See README.md.
//
// Adapted from upstream's scripts/buildPackage.js. The main differences from
// upstream's npm package build are:
//  * Third-party dependencies are bundled (only React is external), so the
//    main LessWrong package doesn't need to install Excalidraw's dependencies.
//  * Fonts are written into the main app's public/ directory and referenced
//    by absolute URL, rather than being fetched from a CDN.
//  * Type declarations are emitted with cross-package imports rewritten into
//    relative paths, so the main app only needs a single path alias.
//  * We emit a list of font faces (readerFontFaces.json), which the main app
//    uses to define @font-face rules for diagrams displayed outside the editor.
//
// The output isn't committed; this runs on every `yarn install` of the main
// app (see scripts/postinstall.sh), and skips rebuilding if none of its inputs
// have changed since the last build. Pass --force to rebuild anyway.
import { build } from "esbuild";
import { sassPlugin } from "esbuild-sass-plugin";
import { execFileSync } from "child_process";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const packagesDir = path.join(rootDir, "packages");
const excalidrawDir = path.join(packagesDir, "excalidraw");
const distDir = path.join(rootDir, "dist");
const typesDir = path.join(distDir, "types");

// Assets (fonts) are served by the main app from public/ at this URL path.
const ASSETS_URL_PATH = "/excalidraw-assets";
const assetsOutDir = path.join(rootDir, "..", "public", "excalidraw-assets");

const packageJson = JSON.parse(
  fs.readFileSync(path.join(rootDir, "package.json"), "utf8"),
);

// Replaces upstream's .env.production. Only the variables referenced by the
// editor packages (not by excalidraw-app) are included.
const IMPORT_META_ENV = {
  MODE: "production",
  PROD: true,
  DEV: false,
  PKG_NAME: "@excalidraw/excalidraw",
  PKG_VERSION: packageJson.version,
  VITE_APP_LIBRARY_URL: "https://libraries.excalidraw.com",
  VITE_APP_LIBRARY_BACKEND:
    "https://us-central1-excalidraw-room-persistence.cloudfunctions.net/libraries",
  VITE_APP_PLUS_LP: "https://plus.excalidraw.com",
  VITE_APP_ENABLE_TRACKING: "false",
  VITE_APP_DEBUG_ENABLE_TEXT_CONTAINER_BOUNDING_BOX: "false",
};

// Font families that are made available (via @font-face rules) wherever
// diagrams are displayed outside of the editor. Xiaolai (the CJK fallback
// font) is omitted because it's split into ~200 files; outside the editor,
// CJK text falls back to system fonts. Helvetica and the emoji font are
// system fonts.
const READER_FONT_FAMILIES = [
  { family: "Excalifont", dir: "Excalifont", exportName: "ExcalifontFontFaces" },
  { family: "Nunito", dir: "Nunito", exportName: "NunitoFontFaces" },
  { family: "Comic Shanns", dir: "ComicShanns", exportName: "ComicShannsFontFaces" },
  { family: "Lilita One", dir: "Lilita", exportName: "LilitaFontFaces" },
  { family: "Virgil", dir: "Virgil", exportName: "VirgilFontFaces" },
  { family: "Cascadia", dir: "Cascadia", exportName: "CascadiaFontFaces" },
  { family: "Liberation Sans", dir: "Liberation", exportName: "LiberationFontFaces" },
];

// Resolve a relative path from the source file's directory
const resolveRelativePath = (importPath, sourceFile) => {
  const sourceDir = path.dirname(sourceFile);
  const extensions = [".scss", ".css", ""];

  for (const ext of extensions) {
    const fullPath = path.resolve(sourceDir, importPath + ext);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
    // Try with underscore prefix for partials
    const partialPath = path.join(
      path.dirname(fullPath),
      `_${path.basename(fullPath)}`,
    );
    if (fs.existsSync(partialPath)) {
      return partialPath;
    }
  }
  return null;
};

// Precompile function to convert relative paths to absolute paths
const precompile = (source, sourcePath) => {
  // Match @use and @forward statements with relative paths
  const importRegex = /(@use|@forward)\s+["'](\.[^"']+)["']/g;

  return source.replace(importRegex, (match, directive, importPath) => {
    const resolvedPath = resolveRelativePath(importPath, sourcePath);
    if (resolvedPath) {
      // Convert to file:// URL format for sass
      const fileUrl = pathToFileURL(resolvedPath).href;
      return `${directive} "${fileUrl}"`;
    }
    return match;
  });
};

// Font files referenced by the bundle, mapped from source path to destination
// path in the main app's public/ dir.
const fontFilesToCopy = new Map();

// Replaces esbuild's file loader for fonts. Font imports (from JS) and url()s
// (from CSS) become absolute URLs under ASSETS_URL_PATH, and the font files are
// copied into public/. (esbuild's `publicPath` option can't be used for this,
// because it also applies to the imports of code-split chunks, which need to
// stay relative so that the main app's bundler can process them.)
const fontAssetsPlugin = {
  name: "font-assets",
  setup(pluginBuild) {
    pluginBuild.onResolve({ filter: /\.woff2$/ }, (args) => {
      const sourcePath = path.resolve(args.resolveDir, args.path);
      const pathWithinFonts = path.relative(
        path.join(excalidrawDir, "fonts"),
        sourcePath,
      );
      if (pathWithinFonts.startsWith("..")) {
        throw new Error(`Unexpected font location: ${sourcePath}`);
      }
      fontFilesToCopy.set(
        sourcePath,
        path.join(assetsOutDir, "fonts", pathWithinFonts),
      );
      const url = `${ASSETS_URL_PATH}/fonts/${pathWithinFonts
        .split(path.sep)
        .join("/")}`;
      if (args.kind === "url-token") {
        return { path: url, external: true };
      }
      return { path: sourcePath, namespace: "font-url", pluginData: { url } };
    });
    pluginBuild.onLoad({ filter: /.*/, namespace: "font-url" }, (args) => ({
      contents: `export default ${JSON.stringify(args.pluginData.url)};`,
      loader: "js",
    }));
  },
};

// Some bundled CommonJS dependencies (eg use-sync-external-store) `require`
// React, which is external. In ESM output, esbuild would leave those as
// runtime `require` calls, which don't work in the main app's bundler. This
// redirects them to an internal ESM module that re-exports React (imported
// with a real `import` statement).
const externalReactRequirePlugin = {
  name: "external-react-require",
  setup(pluginBuild) {
    pluginBuild.onResolve({ filter: /^react(-dom)?(\/.*)?$/ }, (args) =>
      args.kind === "require-call"
        ? { path: args.path, namespace: "external-react-require" }
        : undefined,
    );
    pluginBuild.onLoad(
      { filter: /.*/, namespace: "external-react-require" },
      (args) => ({
        contents: `export * from ${JSON.stringify(args.path)};`,
        loader: "js",
      }),
    );
  },
};

function copyFontFiles() {
  const fontsOutDir = path.join(assetsOutDir, "fonts");
  fs.rmSync(fontsOutDir, { recursive: true, force: true });
  for (const [sourcePath, destPath] of fontFilesToCopy) {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(sourcePath, destPath);
  }
}

const commonOptions = {
  bundle: true,
  format: "esm",
  target: "es2020",
  absWorkingDir: excalidrawDir,
  tsconfig: path.join(rootDir, "tsconfig.json"),
  logLevel: "warning",
};

async function buildBundle() {
  await build({
    ...commonOptions,
    entryPoints: ["index.tsx", "subset/*.chunk.ts"],
    entryNames: "[name]",
    chunkNames: "chunks/[name]-[hash]",
    outdir: distDir,
    splitting: true,
    minify: true,
    external: ["react", "react-dom", "react/*", "react-dom/*"],
    plugins: [
      sassPlugin({ precompile }),
      fontAssetsPlugin,
      externalReactRequirePlugin,
    ],
    define: {
      "import.meta.env": JSON.stringify(IMPORT_META_ENV),
      // Some bundled dependencies (eg mermaid's layout engines) are UMD
      // modules, whose AMD branch looks like `define(["some-package"], ...)`.
      // There's no AMD loader at runtime (so the bundled CommonJS branch is
      // what runs), but the main app's bundler would still try to resolve
      // those package names. Defining `define` as undefined removes the AMD
      // branches entirely.
      define: "undefined",
    },
  });
}

async function buildReaderFontFaces() {
  const entrySource = READER_FONT_FAMILIES.map(
    ({ dir, exportName }) =>
      `export { ${exportName} } from "./fonts/${dir}/index.ts";`,
  ).join("\n");
  const result = await build({
    ...commonOptions,
    stdin: {
      contents: entrySource,
      resolveDir: excalidrawDir,
      loader: "ts",
    },
    outdir: path.join(distDir, "tmp-fonts"),
    platform: "node",
    plugins: [fontAssetsPlugin],
    write: false,
  });
  const jsOutput = result.outputFiles.find((file) => file.path.endsWith(".js"));
  const fontModule = await import(
    `data:text/javascript;base64,${Buffer.from(jsOutput.text).toString("base64")}`
  );

  const fontFaces = READER_FONT_FAMILIES.flatMap(({ family, exportName }) =>
    fontModule[exportName].map(({ uri, descriptors }) => ({
      family,
      src: uri,
      unicodeRange: descriptors?.unicodeRange ?? null,
    })),
  );
  fs.writeFileSync(
    path.join(distDir, "readerFontFaces.json"),
    `${JSON.stringify(fontFaces, null, 2)}\n`,
  );
}

// Maps a bare `@excalidraw/*` specifier to its location inside dist/types.
const packageTypeRoots = {
  common: "common/src",
  element: "element/src",
  excalidraw: "excalidraw",
  "fractional-indexing": "fractional-indexing/src",
  "laser-pointer": "laser-pointer/src",
  math: "math/src",
  utils: "utils/src",
};

function rewriteDeclarationSpecifiers(declarationFile) {
  const source = fs.readFileSync(declarationFile, "utf8");
  const rewritten = source.replace(
    /(["'])@excalidraw\/([a-z-]+)(\/[^"']*)?\1/g,
    (match, quote, packageName, subpath) => {
      const typeRoot = packageTypeRoots[packageName];
      if (!typeRoot) {
        // A real npm package, like @excalidraw/mermaid-to-excalidraw
        return match;
      }
      const target = path.join(typesDir, typeRoot, subpath ?? "/index");
      let relative = path.relative(path.dirname(declarationFile), target);
      if (!relative.startsWith(".")) {
        relative = `./${relative}`;
      }
      return `${quote}${relative}${quote}`;
    },
  );
  if (rewritten !== source) {
    fs.writeFileSync(declarationFile, rewritten);
  }
}

function forEachFile(dir, fn) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      forEachFile(entryPath, fn);
    } else {
      fn(entryPath);
    }
  }
}

function buildTypes() {
  execFileSync(
    path.join(rootDir, "node_modules", ".bin", "tsc"),
    ["-p", path.join(rootDir, "tsconfig.json")],
    { stdio: "inherit" },
  );
  forEachFile(typesDir, (file) => {
    if (file.endsWith(".d.ts")) {
      rewriteDeclarationSpecifiers(file);
    }
  });
  fs.writeFileSync(
    path.join(distDir, "index.d.ts"),
    `export * from "./types/excalidraw/index";\n`,
  );
}

// Everything (relative to rootDir) that the build output depends on.
const BUILD_INPUTS = [
  "build.mjs",
  "package.json",
  "yarn.lock",
  "tsconfig.json",
  "assets.d.ts",
  "packages",
];
const buildHashFile = path.join(distDir, ".build-hash");

function listFilesSorted(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const entryPath = path.join(dir, entry.name);
      return entry.isDirectory() ? listFilesSorted(entryPath) : [entryPath];
    });
}

function computeBuildHash() {
  const hash = crypto.createHash("sha256");
  for (const input of BUILD_INPUTS) {
    const inputPath = path.join(rootDir, input);
    const files = fs.statSync(inputPath).isDirectory()
      ? listFilesSorted(inputPath)
      : [inputPath];
    for (const file of files) {
      hash.update(path.relative(rootDir, file));
      hash.update(fs.readFileSync(file));
    }
  }
  return hash.digest("hex");
}

function isBuildUpToDate(buildHash) {
  return (
    fs.existsSync(buildHashFile) &&
    fs.readFileSync(buildHashFile, "utf8") === buildHash &&
    fs.existsSync(path.join(distDir, "index.js")) &&
    fs.existsSync(path.join(assetsOutDir, "fonts"))
  );
}

const buildHash = computeBuildHash();
if (!process.argv.includes("--force") && isBuildUpToDate(buildHash)) {
  console.log("Excalidraw build is up to date (pass --force to rebuild)");
} else {
  fs.rmSync(distDir, { recursive: true, force: true });
  await buildBundle();
  await buildReaderFontFaces();
  copyFontFiles();
  buildTypes();
  fs.writeFileSync(buildHashFile, buildHash);
  console.log("Built Excalidraw");
}
