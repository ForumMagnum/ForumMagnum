import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

/**
 * This utility reads `petrovDayStory.tex` in the same directory,
 * extracts the body of every top-level \page{…}, \sidePage{…} and
 * \pageNoBottomDiv{…} macro invocation and writes them to
 * `petrovDayStory.ts` as an exported array of objects.
 */

// const TEX_FILENAME = 'test.tsx';
const TEX_FILENAME = 'petrovDayStoryLatex.txt';
const OUTPUT_FILENAME = 'petrovDayStory.ts';

const texPath = path.join(__dirname, TEX_FILENAME);
const outputPath = path.join(__dirname, OUTPUT_FILENAME);

const texSource = readFileSync(texPath , 'utf8');

/**
 * Returns an array containing the raw TeX bodies of every section macro.
 */
function extractSections(source: string): string[] {
  const commands = ['page', 'sidePage', 'pageNoBottomDiv'];
  const sections: string[] = [];

  let i = 0;
  const len = source.length;

  while (i < len) {
    if (source[i] === '\\') {
      // Identify which command (if any) follows the backslash.
      const cmd = commands.find((c) => source.startsWith(c, i + 1));
      if (cmd) {
        const braceIdx = i + 1 + cmd.length;
        if (source[braceIdx] === '{') {
          // Found a candidate. Walk forward to the matching closing brace.
          let depth = 0;
          let j = braceIdx + 1;
          // Scan until we exit the outermost brace.
          for (; j < len; j++) {
            const ch = source[j];
            if (ch === '{') {
              depth++;
            } else if (ch === '}') {
              if (depth === 0) {
                break;
              }
              depth--;
            }
          }
          const inner = source.slice(braceIdx + 1, j).trim();
          sections.push(inner);
          i = j + 1;
          continue;
        }
      }
    }
    i++;
  }

  return sections;
}

const sections = extractSections(texSource);

/**
 * Very small TeX→HTML converter tailored for the macros that appear in the
 * Petrov Day source. It is NOT a general‐purpose LaTeX parser – it only handles
 * the handful of commands that actually occur in the booklet. Anything it
 * doesn’t recognise is passed through unchanged (which is fine for plain text
 * content).
 */
function texToHtml(tex: string): string {
  let html = tex;

  // Comments – strip “% …” to end of line.
  html = html.replace(/^%.*$/gm, "");

  // \divider → <hr>
  html = html.replace(/\\divider/g, "<hr />");

  // Stage directions – italics inside a paragraph
  html = html.replace(/\\stagedir\{([\s\S]*?)\}/g, (_m, dir) => {
    return `<p><em>${dir.trim()}</em></p>`;
  });

  // Blockquotes with attribution
  html = html.replace(/\\blockquote\{([\s\S]*?)\}\{([\s\S]*?)\}/g, (_m, quote, author) => {
    return `<blockquote><p>${quote.trim()}</p><footer>— ${author.trim()}</footer></blockquote>`;
  });

  // Blockquotes without attribution
  html = html.replace(/\\blockquoteUnattributed\{([\s\S]*?)\}/g, (_m, quote) => {
    return `<blockquote><p>${quote.trim()}</p></blockquote>`;
  });

  // Blockquotes, author already included in body (Unmarked)
  html = html.replace(/\\blockquoteUnmarked\{([\s\S]*?)\}\{([\s\S]*?)\}/g, (_m, body, author) => {
    return `<blockquote><p>${body.trim()}</p><footer>— ${author.trim()}</footer></blockquote>`;
  });

  // Poems – convert newlines to <br>
  html = html.replace(/\\poem\{([\s\S]*?)\}\{([\s\S]*?)\}/g, (_m, poem, author) => {
    const body = poem.trim().replace(/\\newline/g, '<br />');
    return `<blockquote class="poem"><p>${body}</p><footer>— ${author.trim()}</footer></blockquote>`;
  });

  // Simple images (candelabrum, includegraphics)
  html = html.replace(/\\candelabrum\{([^}]*)\}/g, (_m, src) => {
    return `<div class="candelabrum"><img src="${src}" alt="candelabrum" /></div>`;
  });
  html = html.replace(/\\includegraphics(?:\[[^\]]*\])?\{([^}]*)\}/g, (_m, src) => {
    return `<img src="${src}" alt="" />`;
  });

  // Candle passing macro → keep the image
  html = html.replace(/\\candlePassing/g, '<img src="images/candlepassing.png" alt="candle passing" />');

  // Italicised speaker cue “(All):” – make following line emphasised
  html = html.replace(/\\textit\{\(All\)\}:\s*([^\n]+)/g, '(All): <em>$1</em>');

  // Remove raw TeX commands we don’t care about (e.g. \newline outside poem)
  html = html.replace(/\\newline/g, "<br />");


  
  // Remove any remaining commands of the form \command{...}
  // This catches things like \begin{itemize} or unknown macros that weren’t converted above.
  html = html.replace(/\\[a-zA-Z]+\{[^}]*\}/g, "");

  // Collapse multiple blank lines into a single delimiter we can turn into <p>.
  html = html.replace(/\n{2,}/g, "\n\n");

  // Convert double-newline paragraph breaks → <p>…</p>
  html = html
    .split(/\n{2,}/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => `<p>${para}</p>`)
    .join("\n");

  return html.trim();
}

// Convert each TeX section to HTML, but further split on <hr> boundaries so that
// every horizontal rule starts a new exported section. The <hr> element itself
// acts purely as a delimiter and is not included in the resulting HTML.
const payload: Array<{ html: string }> = [];

sections.forEach((tex) => {
  const html = texToHtml(tex);

  // Split on <hr />, allowing optional whitespace/self-closing variations.
  const parts = html.split(/<hr\s*\/?>/i);

  parts.forEach((part) => {
    const trimmed = part.trim();
    if (trimmed) {
      payload.push({ html: trimmed });
    }
  });
});
const fileHeader = [
  '// ---------------------------------------------------------------------------',
  '// This file is AUTO-GENERATED by `petrovDayStoryConvert.ts`. Do not edit by hand.',
  '// ---------------------------------------------------------------------------',
  '',
].join('\n');

const tsOut = `${fileHeader}export const petrovDaySections = ${JSON.stringify(
  payload,
  null,
  2
)} as Array<{ html: string }>;
`;

writeFileSync(outputPath, tsOut, 'utf8');
