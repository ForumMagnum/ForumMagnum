/* eslint-disable no-tabs */
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { toWidget } from '@ckeditor/ckeditor5-widget/src/utils';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';

import MathCommand from './mathcommand';

import { defaultConfig, renderEquation, extractDelimiters } from './utils';

export default class MathEditing extends Plugin {
	static get requires() {
		return [ Widget ];
	}

	static get pluginName() {
		return 'MathEditing';
	}

	init() {
		const editor = this.editor;
		editor.commands.add( 'math', new MathCommand( editor ) );

		this._defineSchema();
		this._defineConverters();
	}

	_defineSchema() {
		const schema = this.editor.model.schema;

		schema.register( 'mathtex', {
			allowWhere: '$text',
			isInline: true,
			isObject: true,
			allowAttributes: [ 'equation', 'type' ]
		} );

		schema.register( 'mathtex-display', {
			allowWhere: '$block',
			isObject: true,
			allowAttributes: [ 'equation', 'type' ]
		} );
	}

	_defineConverters() {
		const conversion = this.editor.conversion;
		const mathConfig = Object.assign( defaultConfig, this.editor.config.get( 'math' ) );

		// View -> Model
		conversion.for( 'upcast' )
			// MathJax inline way (e.g. <script type="math/tex">\sqrt{\frac{a}{b}}</script>)
			.elementToElement( {
				view: {
					name: 'script',
					attributes: {
						type: 'math/tex'
					}
				},
				model: ( viewElement, modelWriter ) => {
					const equation = viewElement.getChild( 0 ).data.trim();
					return modelWriter.createElement( 'mathtex', {
						equation,
						type: mathConfig.forceOutputType ? mathConfig.outputType : 'script'
					} );
				}
			} )
			// MathJax display way (e.g. <script type="math/tex; mode=display">\sqrt{\frac{a}{b}}</script>)
			.elementToElement( {
				view: {
					name: 'script',
					attributes: {
						type: 'math/tex; mode=display'
					}
				},
				model: ( viewElement, modelWriter ) => {
					const equation = viewElement.getChild( 0 ).data.trim();
					return modelWriter.createElement( 'mathtex-display', {
						equation,
						type: mathConfig.forceOutputType ? mathConfig.outputType : 'script'
					} );
				}
			} )
			// CKEditor 4 way (e.g. <span class="math-tex">\( \sqrt{\frac{a}{b}} \)</span>)
			.elementToElement( {
				view: {
					name: 'span',
					classes: [ 'math-tex' ]
				},
				model: ( viewElement, modelWriter ) => {
					const rawEquation = viewElement.getChild( 0 ).data.trim();
					const { display, equation } = extractDelimiters( rawEquation );
					const type = mathConfig.forceOutputType ? mathConfig.outputType : 'span';
					if ( display ) {
						return modelWriter.createElement( 'mathtex-display', { equation, type } );
					} else {
						return modelWriter.createElement( 'mathtex', { equation, type } );
					}
				}
			} )
			// Mathjax-node way (e.g. <span class="mjx-chtml"><span aria-label="\sqrt{\frac{a}{b}}"/></span>)
			.elementToElement( {
				view: {
					name: 'span',
					classes: [ 'mjx-chtml' ]
				},
				model: ( viewElement, modelWriter ) => {
					const type = mathConfig.forceOutputType ? mathConfig.outputType : 'span';
					const firstChild = viewElement.getChild( 0 );
					const classes = Array.from( viewElement.getClassNames() );
					if ( classes.includes( 'MJXc-display' ) ) {
						return modelWriter.createElement( 'mathtex-display', { equation: firstChild.getAttribute( 'aria-label' ), type } );
					} else {
						return modelWriter.createElement( 'mathtex', { equation: firstChild.getAttribute( 'aria-label' ), type } );
					}
				}
			} );

		// Model -> View (element)
		conversion.for( 'editingDowncast' )
			.elementToElement( {
				model: 'mathtex',
				view: ( modelItem, viewWriter ) => {
					const widgetElement = createMathtexEditingView( modelItem, viewWriter, false );
					return toWidget( widgetElement, viewWriter );
				}
			} )
			.elementToElement( {
				model: 'mathtex-display',
				view: ( modelItem, viewWriter ) => {
					const widgetElement = createMathtexEditingView( modelItem, viewWriter, true );
					return toWidget( widgetElement, viewWriter );
				}
			} );

		// Model -> Data
		conversion.for( 'dataDowncast' )
			.elementToElement( {
				model: 'mathtex',
				view: ( modelItem, viewWriter ) => createMathtexView( modelItem, viewWriter, false )
			} )
			.elementToElement( {
				model: 'mathtex-display',
				view: ( modelItem, viewWriter ) => createMathtexView( modelItem, viewWriter, true )
			} );

		// Create view for editor
		function createMathtexEditingView( modelItem, viewWriter, display ) {
			const equation = modelItem.getAttribute( 'equation' );

			const styles = 'user-select: none; ' + ( display ? '' : 'display: inline-block;' );
			const classes = 'ck-math-tex ' + ( display ? 'ck-math-tex-display' : 'ck-math-tex-inline' );

			// CKEngine render multiple times if using span instead of div
			const mathtexView = viewWriter.createContainerElement( 'div', {
				style: styles,
				class: classes
			} );

			// Div is formatted as parent container
			const uiElement = viewWriter.createUIElement( 'div', null, function( domDocument ) {
				const domElement = this.toDomElement( domDocument );

				renderEquation( equation, domElement, mathConfig.engine, display, false );

				return domElement;
			} );

			viewWriter.insert( viewWriter.createPositionAt( mathtexView, 0 ), uiElement );

			return mathtexView;
		}

		// Create view for data
		function createMathtexView( modelItem, viewWriter, display ) {
			const equation = modelItem.getAttribute( 'equation' );
			const type = modelItem.getAttribute( 'type' );

			if ( type === 'span' ) {
				const mathtexView = viewWriter.createContainerElement( 'span', {
					class: 'math-tex'
				} );

				if ( display ) {
					viewWriter.insert( viewWriter.createPositionAt( mathtexView, 0 ), viewWriter.createText( '\\[' + equation + '\\]' ) );
				} else {
					viewWriter.insert( viewWriter.createPositionAt( mathtexView, 0 ), viewWriter.createText( '\\(' + equation + '\\)' ) );
				}

				return mathtexView;
			} else {
				const mathtexView = viewWriter.createContainerElement( 'script', {
					type: display ? 'math/tex; mode=display' : 'math/tex'
				} );

				viewWriter.insert( viewWriter.createPositionAt( mathtexView, 0 ), viewWriter.createText( equation ) );

				return mathtexView;
			}
		}
	}
}
