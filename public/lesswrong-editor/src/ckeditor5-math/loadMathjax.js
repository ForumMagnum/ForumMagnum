if ( !window.MathJax ) {
	window.MathJax = {
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
			packages: { '[+]': [ 'noerrors' ] }
		},
		startup: {
			typeset: false,
		}
	};
}
const script = document.createElement( 'script' );
script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
document.head.appendChild( script );
