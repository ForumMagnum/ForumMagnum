
let mjAPI = require('mathjax-node')
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
