if ( !window.MathJax ) {
	window.MathJax = {
		options: {
			renderActions: {
				addMenu: [],
				checkLoading: []
			},
			ignoreHtmlClass: 'tex2jax_ignore',
			processHtmlClass: 'tex2jax_process'
		},
		tex: {
			autoload: {
				color: [],
				colorV2: [ 'color' ]
			},
			packages: { '[+]': [ 'noerrors' ] }
		},
		loader: {
			load: [ 'input/asciimath', '[tex]/noerrors' ]
		}
	};
}
const script = document.createElement( 'script' );
script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
document.head.appendChild( script );
