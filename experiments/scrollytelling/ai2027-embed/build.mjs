import * as esbuild from '/Users/ronnyfernandez/Downloads/ai-2027-graphic/node_modules/esbuild/lib/main.js';
import path from 'node:path';
const P = '/Users/ronnyfernandez/Downloads/ai-2027-graphic';
const SP = process.cwd();
const stub = path.join(SP, 'audio-stub.tsx');
await esbuild.build({
  entryPoints: [path.join(SP, 'entry.tsx')],
  bundle: true, minify: true, format: 'iife', target: 'es2020',
  outfile: path.join(SP, 'out/embed.js'),
  nodePaths: [path.join(P, 'node_modules')],
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"' },
  loader: { '.svg': 'dataurl', '.png': 'dataurl' },
  plugins: [{
    name: 'alias',
    setup(b) {
      b.onResolve({ filter: /contexts\/AudioContext$|\/AudioPlayer$/ }, () => ({ path: stub }));
      b.onResolve({ filter: /^@\// }, a => b.resolve('./' + a.path.slice(2), { resolveDir: P, kind: a.kind }));
      b.onResolve({ filter: /^next\// }, a => ({ path: a.path, namespace: 'nextstub' }));
      b.onLoad({ filter: /.*/, namespace: 'nextstub' }, a => ({ contents: a.path.includes('image') ? "import React from 'react'; export default (p)=>React.createElement('img',{...p,src:p.src?.src||p.src})" : "export default (p)=>p.children", loader: 'jsx', resolveDir: P }));
    }
  }],
  logLevel: 'warning',
});
console.log('built');
