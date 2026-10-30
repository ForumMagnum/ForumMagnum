// EXPERIMENT (experiment/iframe-layout-ronny-exp3): the source of Experiment 3's second demo post, "How
// content blocks behave next to widgets" (see packages/lesswrong/server/layoutDemo/blocksDemoHtml.ts, which
// swaps each <!--demo:side width hN [bottom]--> marker for a plain demo widget placed that way). The HTML is
// in the form the editor saves, so the editor and the post show the same blocks.
const footnoteRef = (n: number) => `<span data-footnote-reference="" data-footnote-id="bd${n}" data-footnote-index="${n}" role="doc-noteref" id="fnrefbd${n}" class="footnote-reference"><sup><a href="#fnbd${n}">[${n}]</a></sup></span>`;
const footnote = (n: number, html: string) => `<li data-footnote-item="" data-footnote-id="bd${n}" data-footnote-index="${n}" role="doc-endnote" id="fnbd${n}" class="footnote-item"><span data-footnote-back-link="" data-footnote-id="bd${n}" class="footnote-back-link"><sup><strong><a href="#fnrefbd${n}">^</a></strong></sup></span><div data-footnote-content="" class="footnote-content">${html}</div></li>`;
const code = (lines: string[]) => `<pre class="code-block" data-language="python" data-highlight-language="python">${lines.map(l => `<span>${l}</span>`).join('<br>')}</pre>`;
const table = (rows: string[][]) => `<table class="editor-table"><tbody>${rows.map((row, i) => `<tr>${row.map(cell => i === 0
  ? `<th class="table-cell table-cell-header"><p>${cell}</p></th>`
  : `<td class="table-cell"><p>${cell}</p></td>`).join('')}</tr>`).join('')}</tbody></table>`;
const image = (text: string, width: number, height: number, style = '', caption = '') =>
  `<figure class="image${style ? ' image_resized' : ''}"${style ? ` style="${style}"` : ''}><img src="https://placehold.co/${width}x${height}/e3eee8/2e6a4b/png?text=${encodeURIComponent(text).replace(/%20/g, '+')}" alt="${text}">${caption ? `<figcaption><p>${caption}</p></figcaption>` : ''}</figure>`;

export const BLOCKS_DEMO_POST_HTML = String.raw`<p>This post shows how each kind of content block behaves next to a widget that text wraps around. Every section puts a demo widget next to one kind of block.</p>
<p>The Editor tab shows the same layout while you edit, and you can drag the widgets around there. Try any window width: each behavior holds at every width. Where less than 300 pixels of text would fit beside a widget, the widget shows full width instead, and every block simply follows it.</p>
<p>There are four behaviors:</p>
<ul><li><strong>Flows beside.</strong> Text: its lines get shorter beside the widget and run the full width below it.</li><li><strong>Sits beside as one box.</strong> Headings, spoilers, and, beside a left widget, quotes, collapsible sections and list items. The whole block moves over, so nothing runs under the widget. If less than 300 pixels is left beside the widget, the block starts below it.</li><li><strong>Sits beside only if it fits at its own size.</strong> Code, tables, images and equations keep their size: beside the widget when they fit there, below it when they don't.</li><li><strong>Starts below the widget.</strong> Dividers, embeds (videos, forecasts, polls) and the footnotes.</li></ul>
<h2>Text flows beside a widget</h2>
<!--demo:right 33% h240-->
<p>A paragraph's lines get shorter while the widget is beside them and run the full width of the column below it. Everything inside a paragraph comes along: <strong>bold</strong> and <em>italic</em> text, <a href="https://www.lesswrong.com/">links</a>, <code>inline code</code>, inline math like <span class="math-tex">\(p(H \mid E)\)</span>, and footnote markers${footnoteRef(1)}. A word, link or equation too long for the room beside the widget moves to the next line that has room, like any long word.</p>
<div class="llm-content-block" data-model-name="Claude Opus 5.5"><div class="llm-content-block-content"><p>AI content flows like any other text. Its label stays at the start of its text, wherever that text starts, and nothing of the block runs under the widget.</p></div></div>
<p>This last paragraph runs on long enough to pass the bottom of the widget, so you can see the lines get longer again once the widget ends. Below the widget, text simply uses the whole column, the same as in a post with no widgets at all.</p>
<h2>Headings sit beside a widget in one piece</h2>
<!--demo:left 33% h320-->
<p>A heading no longer jumps below a widget. That used to leave a hole beside the widget whenever the section before the heading was shorter than the widget.</p>
<h3>A heading beside a widget keeps all its lines at the same edge, however long it gets</h3>
<p>The heading moves over as one box, so a long heading breaks evenly instead of wrapping around the widget's corner. If less than 300 pixels is left beside the widget, it starts below the widget.</p>
<h3>A heading near the widget's bottom edge</h3>
<p>A heading that would sit beside only the last few pixels of a widget starts below it instead, so it doesn't break onto two lines for nothing. The same goes for every block that sits beside a widget as a box.</p>
<h2>Quotes, collapsible sections and spoilers</h2>
<!--demo:left 33% h300-->
<p>Beside a left widget, a quote's bar, a collapsible section's triangle and line, and a spoiler's dark cover would run under the widget, which is see-through. So each moves over as one box:</p>
<blockquote><p>A quote beside a left widget keeps its bar next to its text, out of the widget's way.</p></blockquote>
<details class="detailsBlock" open><summary class="detailsBlockTitle"><p>A collapsible section</p></summary><div class="detailsBlockContent"><p>Its triangle and its line stay beside the widget, open or closed.</p></div></details>
<div class="spoilers"><p>A spoiler: its dark cover stays beside the widget too.</p></div>
<p>A box keeps its narrower width for its whole height. So a box that would hang below the widget more than it sits beside it starts below the widget instead: that leaves less empty space.</p>
<!--demo:right 38% h240-->
<p>Beside a right widget nothing of a quote or a collapsible section runs under the widget, so they simply flow like text:</p>
<blockquote><p>This quote flows beside a right widget like any paragraph. Its bar stays on the left, its lines get shorter while the widget is beside them, and once the widget ends they run the full width of the column again, so a long quote never stays narrow below the widget.</p><p>A second paragraph of the same quote, to carry it past the bottom of the widget.</p></blockquote>
<h2>Lists</h2>
<!--demo:left 33% h290-->
<p>Beside a left widget, each list item moves over as its own box, so the bullets, numbers and checkboxes, and the indents of nested items, stay beside the widget. Items below the widget get the full width back.</p>
<ul><li>A bulleted item, long enough to wrap onto a second line beside the widget.<ul><li>A nested item keeps its indent.<ul><li>So does a third level.</li></ul></li></ul></li><li>Another top-level item.</li></ul>
<ol start="9"><li>Numbered items keep their numbers beside the widget.</li><li>Two-digit numbers too.</li><li>And so on.</li></ol>
<ul __lexicalListType="check"><li role="checkbox" aria-checked="true" value="1">A checked item</li><li role="checkbox" aria-checked="false" value="2">An unchecked item</li></ul>
<p>Beside a right widget, list items flow like text: their markers are on the left, away from the widget.</p>
<h2>Code and tables keep their size</h2>
<!--demo:right 33% h340-->
<p>Code and tables don't wrap the way text does. They sit beside a widget only when they fit there whole; anything wider starts below the widget at full width. A widget never makes code or a table scroll.</p>
${table([['Model', 'Score'], ['Baseline', '0.41'], ['With retrieval', '0.57']])}
${code(['def odds(p):', '    return p / (1 - p)', 'print(odds(0.75))'])}
${code(['def bayes_update(prior, if_true, if_false):', '    """The posterior after one piece of evidence, using the odds form of Bayes."""', '    odds = prior / (1 - prior) * (if_true / if_false)', '    return odds / (1 + odds)'])}
<p>The small table and the short snippet fit beside the widget; the longer code doesn't, so it starts below it.</p>
<h2>Images keep their size</h2>
<!--demo:left 33% h240-->
<p>An image keeps the size its author gave it. A small one sits beside the widget, centered in the room there, with its caption; a large one starts below the widget.</p>
${image('Resized to 40%', 1200, 800, 'width:40%', 'A resized image beside the widget.')}
${image('Full-size image', 1200, 500, '', 'A full-size image starts below the widget.')}
<h2>Equations</h2>
<!--demo:right 33% h220-->
<p>A display equation sits beside the widget when the whole equation fits there, centered in the room. A wider one, like the second, starts below the widget.</p>
<div class="math-tex">\[E = mc^2\]</div>
<div class="math-tex">\[P(H \mid E_1, \dots, E_n) = \frac{P(H) \prod_{i=1}^{n} P(E_i \mid H)}{P(H) \prod_{i=1}^{n} P(E_i \mid H) + P(\neg H) \prod_{i=1}^{n} P(E_i \mid \neg H)}\]</div>
<p>Inline math, like <span class="math-tex">\(\sum_{i=1}^{n} x_i^2\)</span>, moves to the next line that has room, like a long word.</p>
<h2>Dividers, embeds and footnotes start below a widget</h2>
<!--demo:left 33% h200-->
<p>A divider ends a section, so it starts below the widget, like the heading of a new section would.</p>
<hr>
<p>An embed, such as a video, a forecast or a poll, is a frame made for the whole column. Beside a widget it was squeezed or ran under it, so it starts below the widget.</p>
<!--demo:right 33% h160-->
<p>The video starts below this widget.</p>
<div class="youtube-preview"><iframe src="https://www.youtube-nocookie.com/embed/aircAruvnKk" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="YouTube video"></iframe></div>
<p>The footnotes at the end of the post start below the last widget too${footnoteRef(2)}.</p>
<h2>Widgets inside other blocks</h2>
<p>A widget can sit inside a quote, a list item, a collapsible section or AI content. It floats inside that block, sized against the block's own width, and the block holds it: a quote's bar runs past it. Inside a table cell or a footnote, a widget always shows at the full width of the cell or footnote.</p>
<p>Inside a quote, list item or collapsible section, a widget only offers widths that leave at least 300 pixels of text beside it. At the normal column that means 25%, 33% or 38%. 50% isn't offered there, and dragging wider goes straight to full width. A wider block, like an AI content block, can still offer 50% if it fits.</p>
<blockquote><!--demo:left 38% h160--><p>A widget inside a quote. The quote's text wraps beside it, and the quote's bar runs down past it. It follows the same 300 pixel rule, measured inside the quote.</p></blockquote>
<ul><li>A list item before the one holding a widget.</li><li><!--demo:right 33% h140-->This item holds a widget. Its text wraps beside the widget, and the item ends below it.</li><li>An item after it.</li></ul>
<details class="detailsBlock" open><summary class="detailsBlockTitle"><p>A collapsible section holding a widget</p></summary><div class="detailsBlockContent"><!--demo:right 33% h140--><p>The section's text wraps beside the widget, and the section ends below it. Closing the section hides the widget with it.</p></div></details>
<div class="llm-content-block" data-model-name="Claude Opus 5.5"><div class="llm-content-block-content"><!--demo:right 50% h140--><p>A widget inside AI content. This block is as wide as the column, so the widget can take half of it and still leave more than 300 pixels of text beside it. In a narrow window, 50% stops being offered here too.</p></div></div>
<h2>Lining up with the end of a paragraph</h2>
<p>A widget can also line up with the bottom of the paragraph after it (in the editor, drag it over the lower half of a paragraph). It only lines up with a block that runs beside it: never with a heading, a divider or anything else that starts below it.</p>
<!--demo:left 33% h160 bottom-->
<p>This paragraph ends level with the bottom of the widget beside it. The widget is pushed down until its bottom meets the paragraph's last line, so the text runs past its top. However wide the window, the two stay lined up as the text wraps differently.</p>
<p>That's every kind of block. Blocks this post doesn't show (page breaks, columns, polls) either can't be used in a post's editor yet or behave like one of the blocks above.</p>
<ol data-footnote-section="" role="doc-endnotes" class="footnote-section footnotes">${footnote(1, '<p>Footnote markers are part of the text, so they flow with it.</p>')}${footnote(2, '<p>The footnotes clear any widget that would still run beside them.</p>')}</ol>
`;
