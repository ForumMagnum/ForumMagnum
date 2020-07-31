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

async function wait( seconds ) {
	return new Promise( resolve => {
		setTimeout( resolve, seconds );
	} );
}

const MAX_MATHJAX_WAITING_PERIODS = 3;
const MATHJAX_WAITING_PERIOD_LENGTH = 100;
export async function renderEquation( equation, element, engine = 'mathjax', display = false, preview = false, previewUid, pastAttempts = 0 ) {
	if ( pastAttempts > MAX_MATHJAX_WAITING_PERIODS ) {
		console.warn( `MathJax still not loaded, even after waiting ${ MATHJAX_WAITING_PERIOD_LENGTH }ms ${ MAX_MATHJAX_WAITING_PERIODS } times` );
		return;
	}
	if ( typeof MathJax === 'undefined' || !isMathJaxVersion3( MathJax.version ) ) {
		element.innerText = equation;
		console.warn( `math-tex-typesetting-missing: Missing the mathematical typesetting engine (${ engine }) for tex. Waiting for ${ MATHJAX_WAITING_PERIOD_LENGTH } then trying again.` );
		await wait( MATHJAX_WAITING_PERIOD_LENGTH );
		await renderEquation( equation, element, engine, display, preview, previewUid, pastAttempts + 1 );
	} else {
		await renderMathJax3( equation, element, display, preview );
	}
}

const replaceNodeDebounced = debounce( ( oldSheet, newSheet ) => {
	oldSheet.parentNode.removeChild( oldSheet );
	document.head.appendChild( newSheet );
}, 100 );

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

	// First, we clear the element of any remaining children
	element.textContent = '';

	const node = await MathJax.tex2chtmlPromise( equation, { em: 22, ex: 11, display: !!display } );
	upsertNthChild( renderNode, node, 0 );

	if ( !isolateStyles ) {
		const sheet = document.querySelector( '#MJX-CHTML-styles' );
		const newSheet = MathJax.chtmlStylesheet();
		if ( !sheet ) {
			document.head.appendChild( newSheet );
		}
		if ( sheet && !sheet.isEqualNode( newSheet ) ) {
			replaceNodeDebounced( sheet, newSheet );
		}
	}

	if ( isolateStyles ) { // If we isolate the styles, append another style tag with our overwritten styles
		const styleNode = document.createElement( 'style' );
		styleNode.innerHTML = `
			mjx-math {
				font-size: 22px;
			}
			mjx-merror {
				font-size: 14px;
				color: rgba(0,0,0,0.87);
				background-color: transparent;
			}
		`;
		upsertNthChild( renderNode, MathJax.chtmlStylesheet(), 1 );
		upsertNthChild( renderNode, styleNode, 2 );
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

export function debounce( fn, time ) {
	let timeout;

	return function( ...args ) {
		const functionCall = () => fn.apply( this, args );
		clearTimeout( timeout );
		timeout = setTimeout( functionCall, time );
	};
}
