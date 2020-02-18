/* globals MathJax, katex */

import global from '@ckeditor/ckeditor5-utils/src/dom/global';

export const defaultConfig = {
	engine: 'mathjax',
	outputType: 'script',
	forceOutputType: false,
	enablePreview: true
};

export function getSelectedMathModelWidget( selection ) {
	const selectedElement = selection.getSelectedElement();
	if ( selectedElement && selectedElement.is( 'mathtex' ) ) {
		return selectedElement;
	}
	return null;
}

// Simple MathJax 3 version check
export function isMathJaxVersion3( version ) {
	return version && typeof version === 'string' && version.split( '.' ).length === 3 && version.split( '.' )[ 0 ] === '3';
}

// Check if equation has delimiters
export function hasDelimiters( text ) {
	return text.match( /^(\\\[.*?\\\]|\\\(.*?\\\))$/ );
}

// Find delimiters count
export function delimitersCounts( text ) {
	return text.match( /(\\\[|\\\]|\\\(|\\\))/g ).length;
}

// Extract delimiters and figure display mode for the model
export function extractDelimiters( equation ) {
	equation = equation.trim();

	// Remove delimiters (e.g. \( \) or \[ \])
	const hasInlineDelimiters = equation.includes( '\\(' ) && equation.includes( '\\)' );
	const hasDisplayDelimiters = equation.includes( '\\[' ) && equation.includes( '\\]' );
	if ( hasInlineDelimiters || hasDisplayDelimiters ) {
		equation = equation.substring( 2, equation.length - 2 ).trim();
	}

	return {
		equation,
		display: hasDisplayDelimiters
	};
}

export function renderEquation( equation, element, engine = 'katex', display = false, preview = false, previewUid ) {
	if ( engine === 'mathjax' && typeof MathJax !== 'undefined' ) {
		if ( isMathJaxVersion3( MathJax.version ) ) {
			selectRenderMode( element, preview, previewUid, el => {
				renderMathJax3( equation, el, display, () => {
					if ( preview ) {
						moveAndScaleElement( element, el );
						el.style.visibility = 'visible';
					}
				} );
			} );
		} else {
			selectRenderMode( element, preview, previewUid, el => {
				// Fixme: MathJax typesetting cause occasionally math processing error without asynchronous call
				global.window.setTimeout( () => {
					renderMathJax2( equation, el, display );

					// Move and scale after rendering
					if ( preview ) {
						// eslint-disable-next-line
						MathJax.Hub.Queue( () => {
							moveAndScaleElement( element, el );
							el.style.visibility = 'visible';
						} );
					}
				} );
			} );
		}
	} else if ( engine === 'katex' && typeof katex !== 'undefined' ) {
		selectRenderMode( element, preview, previewUid, el => {
			katex.render( equation, el, {
				throwOnError: false,
				displayMode: display
			} );
			if ( preview ) {
				moveAndScaleElement( element, el );
				el.style.visibility = 'visible';
			}
		} );
	} else if ( typeof engine === 'function' ) {
		engine( equation, element, display );
	} else {
		element.innerHTML = equation;
		console.warn( `math-tex-typesetting-missing: Missing the mathematical typesetting engine (${ engine }) for tex.` );
	}
}

function selectRenderMode( element, preview, previewUid, cb ) {
	if ( preview ) {
		createPreviewElement( element, previewUid, prewviewEl => {
			cb( prewviewEl );
		} );
	} else {
		cb( element );
	}
}

function renderMathJax3( equation, element, display, after ) {
	let promiseFunction = undefined;
	if ( typeof MathJax.tex2chtmlPromise !== 'undefined' ) {
		promiseFunction = MathJax.tex2chtmlPromise;
	} else if ( typeof MathJax.tex2svgPromise !== 'undefined' ) {
		promiseFunction = MathJax.tex2svgPromise;
	}

	if ( typeof promiseFunction !== 'undefined' ) {
		promiseFunction( equation, { display } ).then( node => {
			if ( element.firstChild ) {
				element.removeChild( element.firstChild );
			}
			element.appendChild( node );
			after();
		} );
	}
}

function renderMathJax2( equation, element, display ) {
	if ( display ) {
		element.innerHTML = '\\[' + equation + '\\]';
	} else {
		element.innerHTML = '\\(' + equation + '\\)';
	}
	// eslint-disable-next-line
	MathJax.Hub.Queue( [ 'Typeset', MathJax.Hub, element ] );
}

function createPreviewElement( element, previewUid, render ) {
	const prewviewEl = getPreviewElement( element, previewUid );
	render( prewviewEl );
}

function getPreviewElement( element, previewUid ) {
	let prewviewEl = global.document.getElementById( previewUid );
	// Create if not found
	if ( !prewviewEl ) {
		prewviewEl = global.document.createElement( 'div' );
		prewviewEl.setAttribute( 'id', previewUid );
		prewviewEl.style.visibility = 'hidden';
		global.document.body.appendChild( prewviewEl );

		let ticking = false;

		const renderTransformation = () => {
			if ( !ticking ) {
				global.window.requestAnimationFrame( () => {
					moveElement( element, prewviewEl );
					ticking = false;
				} );

				ticking = true;
			}
		};

		// Create scroll listener for following
		global.window.addEventListener( 'resize', renderTransformation );
		global.window.addEventListener( 'scroll', renderTransformation );
	}
	return prewviewEl;
}

function moveAndScaleElement( parent, child ) {
	// Move to right place
	moveElement( parent, child );

	// Scale parent element same as preview
	const domRect = child.getBoundingClientRect();
	parent.style.width = domRect.width + 'px';
	parent.style.height = domRect.height + 'px';
}

function moveElement( parent, child ) {
	const domRect = parent.getBoundingClientRect();
	const left = global.window.scrollX + domRect.left;
	const top = global.window.scrollY + domRect.top;
	child.style.position = 'absolute';
	child.style.left = left + 'px';
	child.style.top = top + 'px';
	child.style.zIndex = 'var(--ck-z-modal)';
	child.style.pointerEvents = 'none';
}
