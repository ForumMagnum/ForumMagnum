import React from 'react';
import { convertFromHTML, convertToHTML } from 'draft-convert';

export const htmlToDraft = convertFromHTML({
  htmlToEntity: (nodeName, node, createEntity) => {
    if (nodeName === 'img') {
      const nodeImg = (node as HTMLImageElement);
      return createEntity(
        'IMAGE',
        'IMMUTABLE',
        {src: nodeImg.src}
      )
    }
    if (nodeName === 'a') {
      const nodeA = (node as HTMLAnchorElement);
      return createEntity(
        'LINK',
        'MUTABLE',
        {url: nodeA.href}
      )
    }
    // if (nodeName === 'img') {
    //   return createEntity(
    //     'IMAGE',
    //     'IMMUTABLE',
    //     {src: node.src}
    //   )
    // }
  },
  // htmlToBlock is annotated by DefinitelyTyped as having only two arguments,
  // but the third and fourth argument here (lastList, inBlock) are maaaaybe
  // real. Nothing here breaks if they aren't real, and I don't feel like figuring
  // it out, so:
  // @ts-ignore
  htmlToBlock: (nodeName, node, lastList, inBlock) => {
    if ((nodeName === 'figure' && node.firstChild?.nodeName === 'IMG') || (nodeName === 'img' && inBlock !== 'atomic')) {
        return 'atomic';
    }
    // if (nodeName === 'blockquote') {
    //   return {
    //     type: 'blockquote',
    //     data: {}
    //   };
    // }
    if (nodeName === 'hr') { // This currently appears to be broken, sadly. TODO: Fix this
      return {
        type: 'divider',
        data: {},
        text: 'as',
        depth: 0,
        inlineStyleRanges: [ { offset: 0, length: 2, style: 'ITALIC' } ],
      }
    }
  }
})

export const draftToHTML = convertToHTML({
  //eslint-disable-next-line react/display-name
  styleToHTML: (style) => {
    if (style === 'STRIKETHROUGH') {
      return <span style={{textDecoration: 'line-through'}} />;
    }
  },
  entityToHTML: (entity, originalText) => {
    if (entity.type === 'image' || entity.type === 'IMAGE') {
      let classNames = 'draft-image '
      if (entity.data.alignment) {
        classNames = classNames + entity.data.alignment;
      }
      let style = "width:" + (entity.data.width || 40) + "%"
      return `<figure><img src="${entity.data.src}" class="${classNames}" style="${style}" /></figure>`;
    }
    if (entity.type === 'LINK') {
      return {
        start: `<a href="${entity.data.url || entity.data.href}">`,
        end: '</a>',
      };
    }
    if (entity.type === 'IMG') {
      const className = 'draft-inline-image';
      return `<img src="${entity.data.src}" class="${className}" alt="${entity.data.alt}"/>`
    }
    if (entity.type === 'INLINETEX') {
      if (entity.data.html) {
        return `<span>${entity.data.css ? `<style>${entity.data.css}</style>` : ""}${entity.data.html}</span>`
      } else {
        return `<span class="draft-latex-placeholder"> &lt; refresh to render LaTeX &gt; </span>`
      }
    }
    return originalText;
  },
  //eslint-disable-next-line react/display-name
  blockToHTML: (block) => {
    // This uses some DraftJS internal structure, and DefinitelyTyped doesn't
    // annotate it. (It does annotate a getType/getData/getText, but these
    // annotations don't seem to actually match the version we're using.)
    // Luckily, draftjs is unlikely to ever receive a major update that we need,
    // so the internal structures will stay the same.
    // @ts-ignore
    const type = block.type;
    if (type === 'atomic') {
      // @ts-ignore
      const data = block.data;
      if (data && data.mathjax && data.html) {
        return `<div>${data.css ? `<style>${data.css}</style>` : ""}${data.html}</div>`
      } else if (data && data.mathjax) {
        return `<div class="draft-latex-placeholder-block"> &lt;refresh to render LaTeX&gt; </div>`
      } else {
        return {start: '<span>', end: '</span>'};
      }
    }
    if (type === 'blockquote') {
      return <blockquote />
    }
    if (type === 'code-block') {
      return {start: '<pre><code>', end: '</code></pre>'};
    }
    if (type === 'divider') {
     return <hr className="dividerBlock" />
    }
    if (type === 'spoiler') {
     return <p className="spoiler-v2" /> // this is the second iteration of a spoiler-tag that we've implemented. Changing the name for backwards-and-forwards compatibility
    }
    if (type === 'unstyled') {
      // @ts-ignore
      const text = block.text;
      if (text === ' ' || text === '') return <br />;
      return <p />
    }
    //  return <span/>;
   },
});
