/**
 * Process math in a script node using MathJax
 * @param {MathJax}  MathJax
 * @param {DOMNode}  script
 * @param {Function} callback
 */
export default function processTeX(MathJax, script, callback) {
  const inline = script.dataset.type === "inline"
  let options = {...MathJax.getMetricsFor(script, true), display: !inline}
  MathJax.tex2chtmlPromise(script.dataset.mathjax || '', options)
    .then((html) => {
      if (script.childNodes[ 0 ]) {
        script.replaceChild( html, script.childNodes[ 0 ] )
      } else {
        script.appendChild( html )
      }
      let sheet = document.querySelector('#MJX-CHTML-styles')
      if (sheet) sheet.parentNode.removeChild(sheet)
      document.head.appendChild(MathJax.chtmlStylesheet())
      callback()
    })
}

