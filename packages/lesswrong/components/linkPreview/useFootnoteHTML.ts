import { useContext, useEffect, useState } from 'react';
import { ContentItemBodyContext } from '../contents/ContentItemBodyContext';

export function useFootnoteHTML(href: string, footnoteAncestors: string[]): string|null {
  const bodyHTML = useContext(ContentItemBodyContext);
  const [footnoteHTML, setFootnoteHTML] = useState<string|null>(null);

  useEffect(() => {
    setFootnoteHTML(footnoteAncestors.includes(href) ? null : extractFootnoteHTML(href));
  }, [href, footnoteAncestors, bodyHTML]);

  return footnoteHTML;
}

function extractFootnoteHTML(href: string): string|null {
  // Get the contents of the linked footnote.
  // This has a try-catch-ignore around it because the link doesn't necessarily
  // make a valid CSS selector; eg there are some posts in the DB with internal
  // links to anchors like "#fn:1" which will crash this because it has a ':' in
  // it.
  try {
    // `href` is (probably) an anchor link, of the form `#fn1234`. Since it starts
    // with a hash it can also be used as a CSS selector, which finds its contents
    // in the footer.
    const footnoteContentsElement = document.querySelector(href);
    const footnoteHTML = footnoteContentsElement?.innerHTML ?? null;
    // The truncator marks open elements at the cutoff. Also check descendants
    // in case the linked element is a wrapper added while rendering the HTML.
    if (footnoteContentsElement && !footnoteContentsElement.hasAttribute("data-truncated")
      && !footnoteContentsElement.querySelector('[data-truncated]')
      && isFootnoteContentsNonempty(footnoteContentsElement)) {
      return footnoteHTML;
    } else {
      return null;
    }
  } catch(e) {
    return null;
  }
}

const isFootnoteContentsNonempty = (footnoteContentsElement: Element): boolean => {
  // Decide whether the footnote is nonempty. This is tricky because while there
  // are consistently formatted footnotes created by our editor plugins, there
  // are also wacky irregular footnotes present in imported HTML and similar
  // things. Eg https://www.lesswrong.com/posts/ACGeaAk6KButv2xwQ/the-halo-effect
  // We can't just condition on the footnote containing non-whitespace text,
  // because footnotes sometimes have their number and backlink in a place that
  // would be mistaken for their body. Our current heuristic is that a footnote
  // is nonempty if it contains at least one <p> which contains non-whitespace
  // text, which might false-negative on rare cases like an image-only footnote
  // but which seems to work in practice.
  return !!footnoteContentsElement
    && !!Array.from(footnoteContentsElement.querySelectorAll("p, li"))
      .reduce((acc, p) => acc + p.textContent, "").trim();
}
