/* eslint-disable no-tabs */
export function loadMathJax() {
	if ( !window.MathJax ) {
		window.MathJax = {
			loader: {load: ['[tex]/colorV2']},
			options: {
				renderActions: {
					addMenu: [],
					checkLoading: []
				}
			},
			tex: {
				autoload: {
					color: [],
					colorV2: [ 'color' ]
				},
				packages: { '[+]': [ 'noerrors', 'color' ] }
			},
			startup: {
				typeset: false,
				// Ready callback is used by draft-js-mathjax to know when it's safe to run MathJax code
				pageReady: () => { window.MathJaxReady = true; }
			}
		};
		const script = document.createElement( 'script' );
		script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3.1.1/es5/tex-mml-chtml.js';
		document.head.appendChild( script );
	}
}

