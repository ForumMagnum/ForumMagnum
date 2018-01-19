import React from 'react';
import { convertFromHTML, convertToHTML } from 'draft-convert';
import { Utils } from 'meteor/vulcan:core';


export const htmlToDraft = convertFromHTML({
  htmlToEntity: (nodeName, node, createEntity) => {
    if (nodeName === 'a') {
      return createEntity(
        'LINK',
        'MUTABLE',
        {url: node.href}
      )
    }
  },
  htmlToBlock: (nodeName, node) => {
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
  styleToHTML: (style) => {
    if (style === 'STRIKETHROUGH') {
      return <span style={{textDecoration: 'line-through'}} />;
    }
  },
  entityToHTML: (entity, originalText) => {
    if (entity.type === 'image') {
      let classNames = 'draft-image '
      if (entity.data.alignment) {
        classNames = classNames + entity.data.alignment;
      }
      let style = ""
      if (entity.data.width) {
        style = "width:" + entity.data.width + "%";
      }
      return `<figure><img src="${entity.data.src}" class="${classNames}" style="${style}" /></figure>`;
    }
    if (entity.type === 'LINK') {
      return `<a href="${entity.data.url || entity.data.href}">${originalText}</a>`;
    }
    if (entity.type === 'IMG') {
      const className = 'draft-inline-image';
      return `<img src="${entity.data.src}" class="${className}" alt="${entity.data.alt}"/>`
    }
    if (entity.type === 'INLINETEX') {
      console.log("INLINETEX entity detected: ", entity);
      if (entity.data.html) {
        return `<span><style>${entity.data.css}</style>${entity.data.html}</span>`
      } else {
        return `<span class="draft-latex-placeholder">refresh to render LaTeX</span>`
      }
    }
    return originalText;
  },
  blockToHTML: (block) => {
     const type = block.type;
     if (type === 'atomic') {
       console.log("Atomic element detected: ", block);
       if (block.data && block.data.mathjax && block.data.html) {
         return `<div><style>${block.data.css}</style>${block.data.html}</div>`
       } else if (block.data && block.data.mathjax) {
         return `<div class="draft-latex-placeholder-block">refresh to render LaTeX</div>`
       } else {
         return {start: '<span>', end: '</span>'};
       }
     }
     if (type === 'blockquote') {
       return <blockquote />
     }
     if (type === 'divider') {
       return <hr className="dividerBlock" />
     }
    //  return <span/>;
   },
});

Utils.draftToHTML = draftToHTML;
Utils.htmlToDraft = htmlToDraft;
