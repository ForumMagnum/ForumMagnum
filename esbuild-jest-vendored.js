/**
 * Modified from https://github.com/etroynov/esbuild-jest/tree/master/src
 * (Mostly just combined all 4 files into one, stripped out the types, and commented out the babelTransform code)
 * MIT License: https://github.com/etroynov/esbuild-jest/tree/master?tab=MIT-1-ov-file#readme
 */

import path from "path";
import { transformSync } from "esbuild";
import babelJest from "babel-jest";

const { process } = babelJest.createTransformer({
  plugins: [ "@babel/plugin-transform-modules-commonjs" ],
  parserOpts: { 
    plugins: ["jsx", "typescript"],
  }
});

export function babelTransform(opts) {
  const { sourceText, sourcePath, options } = opts
  const babelResult = process(sourceText, sourcePath, options)
  return babelResult.code
}
export const loaders = ["js", "jsx", "ts", "tsx", "json"]

export const getExt = (str) => {
  const basename = path.basename(str);
  const firstDot = basename.indexOf('.');
  const lastDot = basename.lastIndexOf('.');
  const extname = path.extname(basename).replace(/(\.[a-z0-9]+).*/i, '$1');

  if (firstDot === lastDot) return extname

  return basename.slice(firstDot, lastDot) + extname
}

const transformer = {
  canInstrument: true,
  process(
    content,
    filename,
    opts
  ) {
    const options = opts.transformerConfig;
    const sources = { code: content };
    const ext = getExt(filename),
      extName = path.extname(filename).slice(1);

    const enableSourcemaps = options?.sourcemap || false;
    const loader = (
      options?.loaders && options?.loaders[ext]
        ? options.loaders[ext]
        : loaders.includes(extName)
        ? extName
        : "text"
    );
    const sourcemaps = enableSourcemaps
      ? { sourcemap: true, sourcesContent: false, sourcefile: filename }
      : {};

    /// this logic or code from
    /// https://github.com/threepointone/esjest-transform/blob/main/src/index.js
    /// this will support the jest.mock
    /// https://github.com/etroynov/esbuild-jest/issues/12
    /// TODO: transform the jest.mock to a function using babel traverse/parse then hoist it
    /// RobertM: This used to match on `ock(` but that seemed too narrow.
    /// It also went through babelTransform when `opts.instrument` was true, which was "always" in CI (i.e. `unit-ci`)
    /// I'm not sure why that needed to happen, but there doesn't seem to be a good reason to do that.
    if (sources.code.indexOf(".mock(") >= 0) {
      const source = babelTransform({
        sourceText: content,
        sourcePath: filename,
        options: opts,
      });
      sources.code = source;
    }

    const result = transformSync(sources.code, {
      loader,
      format: (options?.format) || "cjs",
      target: options?.target || "es2018",
      ...(options?.jsxFactory ? { jsxFactory: options.jsxFactory } : {}),
      ...(options?.jsxFragment ? { jsxFragment: options.jsxFragment } : {}),
      ...sourcemaps,
    });

    let { map, code } = result;
    if (enableSourcemaps) {
      map = {
        ...JSON.parse(result.map),
        sourcesContent: null,
      };

      // Append the inline sourcemap manually to ensure the "sourcesContent"
      // is null. Otherwise, breakpoints won't pause within the actual source.
      code =
        code +
        "\n//# sourceMappingURL=data:application/json;base64," +
        Buffer.from(JSON.stringify(map)).toString("base64");
    } else {
      map = null;
    }

    return { code, map };
  },
};

export default transformer;