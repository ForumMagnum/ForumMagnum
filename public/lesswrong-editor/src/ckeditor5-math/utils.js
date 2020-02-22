/* eslint-disable max-len */
/* eslint-disable no-tabs */
/* globals MathJax */

export const defaultConfig = {
	engine: 'mathjax',
	outputType: 'script',
	forceOutputType: false,
	enablePreview: true
};

export function getSelectedMathModelWidget( selection ) {
	const selectedElement = selection.getSelectedElement();
	if ( selectedElement && ( selectedElement.is( 'mathtex' ) || selectedElement.is( 'mathtex-display' ) ) ) {
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

export async function renderEquation( equation, element, engine = 'mathjax', display = false, preview = false, previewUid ) {
	if ( engine === 'mathjax' && typeof MathJax !== 'undefined' ) {
		if ( isMathJaxVersion3( MathJax.version ) ) {
			await renderMathJax3( equation, element, display, preview );
		}
	} else {
		element.innerHTML = equation;
		console.warn( `math-tex-typesetting-missing: Missing the mathematical typesetting engine (${ engine }) for tex.` );
	}
}

async function renderMathJax3( equation, element, display, isolateStyles ) {
	let renderNode = element;
	if ( isolateStyles ) {
		if ( !element.attachShadow ) {
			throw Error( 'Rendering MathJax with isolateStyles requires support for Shadow DOM' );
		}
		if ( !element.shadowRoot ) {
			element.attachShadow( { mode: 'open' } );
		}
		renderNode = element.shadowRoot;
	}

	const node = await MathJax.tex2chtmlPromise( equation, { em: 22, ex: 11, display: !!display } );
	const errorNode = node.querySelector( 'mjx-merror' );
	if ( !errorNode || !isolateStyles ) {
		upsertNthChild( renderNode, node, 0 );
	} else {
		const errorMessageNode = document.createElement( 'div' );
		errorMessageNode.innerText = errorNode.getAttribute( 'data-mjx-error' );
		errorMessageNode.className = 'ck-math-error';
		upsertNthChild( renderNode, errorMessageNode, 0 );
	}

	upsertNthChild( renderNode, MathJax.chtmlStylesheet(), 1 );

	if ( isolateStyles ) { // If we isolate the styles, set the fontSize to 22px, otherwise just inherit it
		node.style.fontSize = '22px';
	}
}

function upsertNthChild( element, child, n ) {
	if ( element.childNodes[ n ] ) {
		element.replaceChild( child, element.childNodes[ n ] );
	} else {
		element.appendChild( child );
	}
}

export function resizeInputElement( element ) {
	const lines = element.value.split( /\n/ );
	const maxLines = Math.max( ...lines.map( line => line.length ) );
	element.cols = maxLines || 1;
	element.rows = lines.length || 1;
}
