import React from 'react';

export const getHtmlToDraft = () => {
  const { convertFromHTML } = require('draft-convert')
  return convertFromHTML({
    htmlToEntity: (nodeName, node, createEntity) => {
      if (nodeName === 'img') {
        return createEntity(
          'IMAGE',
          'IMMUTABLE',
          {src: node.src}
        )
      }
      if (nodeName === 'a') {
        return createEntity(
          'LINK',
          'MUTABLE',
          {url: node.href}
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
}

export const getDraftToHTML = () => {
  const { convertToHTML } = require('draft-convert')
  return convertToHTML({
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
      const type = block.type;
      if (type === 'atomic') {
        if (block.data && block.data.mathjax && block.data.html) {
          return `<div>${block.data.css ? `<style>${block.data.css}</style>` : ""}${block.data.html}</div>`
        } else if (block.data && block.data.mathjax) {
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
        if (block.text === ' ' || block.text === '') return <br />;
        return <p />
      }
      //  return <span/>;
     },
  });
}
