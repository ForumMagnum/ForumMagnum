
// Copied from https://github.com/efloti/draft-js-mathjax-plugin/blob/master/src/mathjax/load.js
// And https://github.com/efloti/draft-js-mathjax-plugin/blob/master/src/mathjax/loadMathJax.js 
function load(src, cb) {
  const head = document.head || document.getElementsByTagName('head')[0]
  const script = document.createElement('script')

  script.type = 'text/javascript'
  script.async = true
  script.src = src

  if (cb) {
    script.onload = () => {
      script.onerror = null
      script.onload = null
      cb(null, script)
    }
    script.onerror = () => {
      script.onerror = null
      script.onload = null
      cb(new Error(`Failed to load ${src}`), script)
    }
  }

  head.appendChild(script)
}

// mathjax cdn shutdown the 30/04/2017!!! https://cdn.mathjax.org/mathjax/latest/MathJax.js
const DEFAULT_SCRIPT = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.0/MathJax.js'

const DEFAULT_OPTIONS = {
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
    window.MathJax.Hub.Config(config.options)
    window.MathJax.Hub.processSectionDelay = 0
    return
  }
  load(config.script, (err) => {
    if (!err) {
      window.MathJax.Hub.Config(config.options)
      // avoid flickering of the preview
      window.MathJax.Hub.processSectionDelay = 0
    }
  })
}

export default loadMathJax