// const loadScript = require('load-script')
import load from './load'

// mathjax cdn shutdown the 30/04/2017!!! https://cdn.mathjax.org/mathjax/latest/MathJax.js
const DEFAULT_SCRIPT = 'https://cdn.jsdelivr.net/npm/mathjax@3.1.2/es5/tex-mml-chtml.js'

const DEFAULT_OPTIONS = {
  loader: {load: ['[tex]/colorv2']},
  options: {
    renderActions: {
      addMenu: [],
      checkLoading: []
    }
  },
  tex: {
    autoload: {
      color: [],
      colorv2: [ 'color' ]
    },
    packages: { '[+]': [ 'noerrors', 'color' ] }
  },
  startup: {
    typeset: false,
  }
}

const loadMathJax = ({ macros: Macros, script, mathjaxConfig }) => {
  const config = {}
  config.script = script || DEFAULT_SCRIPT
  config.options = mathjaxConfig || DEFAULT_OPTIONS
  if (config.options.TeX === undefined) {
    config.options.TeX = {}
  }
  const TeX = Object.assign(config.options.TeX, { Macros })
  config.options = Object.assign(config.options, { TeX })

  if (window.MathJax) {
    return
  }
  window.MathJax = config.options
  
  load(config.script, (err) => {window.MathJaxReady = true})
}

export default loadMathJax
