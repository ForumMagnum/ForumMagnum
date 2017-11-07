import React from 'react';
import { convertFromHTML, convertToHTML } from 'draft-convert';
import { convertFromRaw, convertToRaw } from 'draft-js';

let mjAPI = {};

if (Meteor.isServer) {
  mjAPI = require('mathjax-node')
  const MATHJAX_OPTIONS = {
    jax: ['input/TeX', 'output/CommonHTML'],
    TeX: {
      extensions: ['autoload-all.js'],
    },
    messageStyles: 'none',
    showProcessingMessages: false,
    showMathMenu: false,
    showMathMenuMSIE: false,
    preview: 'none',
    delayStartupTypeset: true,
  }

  mjAPI.config({
    MathJax: MATHJAX_OPTIONS
  });
  mjAPI.start();
}

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

export const preProcessLatex = async (content) => {
  console.log("Preprocessing LaTeX", content);
  let entityMap = content.entityMap;
  for (let key in entityMap) { // Can't use forEach with await
    let value = entityMap[key];
    if(value.type === "INLINETEX" && value.data.teX) {
      console.log("preprocess inlineTex: ", value);
      const mathJax = await mjAPI.typeset({
            math: value.data.teX,
            format: "inline-TeX",
            html: true,
            css: true,
      })
      console.log("MathJax result: ", mathJax);
      value.data = {...value.data, html: mathJax.html, css: mathJax.css};
      entityMap[key] = value;
    }
  }
  content.entityMap = entityMap;

  let blocks = content.blocks;
  for (let key in blocks) {
    const block = blocks[key];
    console.log("preprocessing LaTeX block: ", block);
    if (block.type === "atomic" && block.data.mathjax) {
      const mathJax = await mjAPI.typeset({
        math: block.data.teX,
        format: "TeX",
        html: true,
        css: true,
      })
      block.data = {...block.data, html: mathJax.html, css: mathJax.css};
    }
  }
  content.blocks = blocks;

  return content;
}

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
