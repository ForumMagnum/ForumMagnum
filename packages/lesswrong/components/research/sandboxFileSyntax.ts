import Prism from 'prismjs';

// Grammars loaded for the file viewer. Prism core ships markup, css, clike, and
// javascript; the rest are pulled in here. Order matters — a grammar that
// extends another must be imported after it (jsx→js, tsx→jsx, etc.).
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-toml';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-graphql';
import 'prismjs/components/prism-diff';

// Extension (lowercase, no dot) → Prism language id. Extensions with no entry
// render as plain text (still monospace, just unhighlighted).
const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'jsx',
  ts: 'typescript', mts: 'typescript', cts: 'typescript', tsx: 'tsx',
  json: 'json', json5: 'json',
  py: 'python', pyi: 'python',
  sh: 'bash', bash: 'bash', zsh: 'bash',
  yml: 'yaml', yaml: 'yaml',
  md: 'markdown', markdown: 'markdown',
  css: 'css', scss: 'scss', sass: 'scss',
  sql: 'sql',
  go: 'go', rs: 'rust', rb: 'ruby', java: 'java',
  toml: 'toml',
  dockerfile: 'docker',
  graphql: 'graphql', gql: 'graphql',
  diff: 'diff', patch: 'diff',
  html: 'markup', htm: 'markup', xml: 'markup', svg: 'markup', vue: 'markup',
};

// Filenames (lowercase) that imply a language despite no/other extension.
const FILENAME_TO_LANGUAGE: Record<string, string> = {
  dockerfile: 'docker',
  makefile: 'bash',
  '.gitconfig': 'toml',
  '.bashrc': 'bash',
  '.zshrc': 'bash',
  '.env': 'bash',
};

function languageForPath(path: string): string | null {
  const name = (path.split('/').pop() ?? path).toLowerCase();
  if (FILENAME_TO_LANGUAGE[name]) return FILENAME_TO_LANGUAGE[name];
  const dot = name.lastIndexOf('.');
  if (dot <= 0) return null; // no extension, or a dotfile with no further ext
  const ext = name.slice(dot + 1);
  return EXTENSION_TO_LANGUAGE[ext] ?? null;
}

export interface HighlightedFile {
  /** Prism-highlighted HTML (token spans), or null when unhighlighted. */
  html: string | null;
  /** The resolved language id, for display / debugging. */
  language: string | null;
}

/**
 * Highlight file text for the read-only viewer, choosing the grammar from the
 * file's extension/name. Returns `html: null` when the extension is unknown or
 * its grammar failed to load, so the caller can fall back to plain text.
 */
export function highlightFile(path: string, content: string): HighlightedFile {
  const language = languageForPath(path);
  if (!language) return { html: null, language: null };
  const grammar = Prism.languages[language];
  if (!grammar) return { html: null, language };
  try {
    return { html: Prism.highlight(content, grammar, language), language };
  } catch {
    return { html: null, language };
  }
}
