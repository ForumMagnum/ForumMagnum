import React from 'react';
import { convertFromHTML, convertToHTML } from 'draft-convert';

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
      return <a href={entity.data.url || entity.data.href}>{originalText}</a>;
    }
    if (entity.type === 'IMG') {
      const className = 'draft-inline-image';
      return `<img src="${entity.data.src}" class="${className}" alt="${entity.data.alt}"/>`
    }
    return originalText;
  },
  blockToHTML: (block) => {
     const type = block.type;
     if (type === 'atomic') {
       return {start: '<span>', end: '</span>'};
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
