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
			allowAttributes: [ 'equation', 'type', 'display' ]
		} );

		schema.register( 'mathtex-display', {
			allowWhere: '$block',
			isObject: true,
			allowAttributes: [ 'equation', 'type', 'display' ]
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
				model: ( viewElement, { writer } ) => {
					const equation = viewElement.getChild( 0 ).data.trim();
					return writer.createElement( 'mathtex', {
						equation,
						type: mathConfig.forceOutputType ? mathConfig.outputType : 'script',
						display: false
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
				model: ( viewElement, { writer } ) => {
					const equation = viewElement.getChild( 0 ).data.trim();
					return writer.createElement( 'mathtex-display', {
						equation,
						type: mathConfig.forceOutputType ? mathConfig.outputType : 'script',
						display: true
					} );
				}
			} )
			// CKEditor 4 way (e.g. <span class="math-tex">\( \sqrt{\frac{a}{b}} \)</span>)
			.elementToElement( {
				view: {
					name: 'span',
					classes: [ 'math-tex' ]
				},
				model: ( viewElement, { writer } ) => {
					const rawEquation = viewElement.getChild( 0 ).data.trim();
					const { display, equation } = extractDelimiters( rawEquation );
					const type = mathConfig.forceOutputType ? mathConfig.outputType : 'span';
					if ( display ) {
						return writer.createElement( 'mathtex-display', { equation, type, display  } );
					} else {
						return writer.createElement( 'mathtex', { equation, type, display } );
					}
				}
			} )
			// Mathjax-node way (e.g. <span class="mjx-chtml"><span aria-label="\sqrt{\frac{a}{b}}"/></span>)
			.elementToElement( {
				view: {
					name: 'span',
					classes: [ 'mjx-chtml' ]
				},
				model: ( viewElement, { writer } ) => {
					const type = mathConfig.forceOutputType ? mathConfig.outputType : 'span';
					const firstChild = viewElement.getChild( 0 );
					const classes = Array.from( viewElement.getClassNames() );
					if ( classes.includes( 'MJXc-display' ) ) {
						return writer.createElement( 'mathtex-display', { equation: firstChild.getAttribute( 'aria-label' ), type, display: true } );
					} else {
						return writer.createElement( 'mathtex', { equation: firstChild.getAttribute( 'aria-label' ), type, display: false } );
					}
				}
			} )
			// Despite promises of editing views being read only and never being
			// upcast, they are actually upcast. This is the custom upcast for the
			// inline math element editing view. Otherwise, a broken upcast would be
			// used. See: https://github.com/ckeditor/ckeditor5/issues/8874
			.elementToElement( {
				view: {
					name: 'span',
					attributes: {
						'data-math-tex': true
					}
				},
				model: ( viewElement, { writer } ) => {
					const equation = viewElement.getAttribute( 'data-math-tex' );
					const type = mathConfig.forceOutputType ? mathConfig.outputType : 'span';
					return writer.createElement( 'mathtex', {
						equation,
						type,
						display: false
					})
				}
			});

		// Model -> View (element)
		conversion.for( 'editingDowncast' )
			.elementToElement( {
				model: 'mathtex',
				view: ( modelItem, { writer } ) => {
					const widgetElement = createMathtexEditingView( modelItem, writer, false );
					return toWidget( widgetElement, writer, 'span' );
				}
			} )
			.elementToElement( {
				model: 'mathtex-display',
				view: ( modelItem, { writer } ) => {
					const widgetElement = createMathtexEditingView( modelItem, writer, true );
					return toWidget( widgetElement, writer, 'div' );
				}
			} );

		// Model -> Data
		conversion.for( 'dataDowncast' )
			.elementToElement( {
				model: 'mathtex',
				view: ( modelItem, { writer } ) => createMathtexView( modelItem, writer, false )
			} )
			.elementToElement( {
				model: 'mathtex-display',
				view: ( modelItem, { writer } ) => createMathtexView( modelItem, writer, true )
			} );

		// Create view for editor
		function createMathtexEditingView( modelItem, writer, display ) {
			const equation = modelItem.getAttribute( 'equation' );

			const styles = 'user-select: none; ' + ( display ? '' : 'display: inline-block;' );
			const classes = 'ck-math-tex ' + ( display ? 'ck-math-tex-display' : 'ck-math-tex-inline' );

			// CKEngine render multiple times if using span instead of div
			const mathtexView = writer.createContainerElement( display ? 'div' : 'span', {
				style: styles,
				class: classes,
				// Q: Should we be worried about XSS here?
				// We tested that either ckeditor or chrome is escaping our XSS attempts
				'data-math-tex': equation
			} );

			// Div is formatted as parent container
			const uiElement = writer.createUIElement( 'div', null, function( domDocument ) {
				const domElement = this.toDomElement( domDocument );

				renderEquation( equation, domElement, mathConfig.engine, display, false );

				return domElement;
			} );

			writer.insert( writer.createPositionAt( mathtexView, 0 ), uiElement );

			return mathtexView;
		}

		// Create view for data
		function createMathtexView( modelItem, writer, display ) {
			const equation = modelItem.getAttribute( 'equation' );
			const type = modelItem.getAttribute( 'type' );

			if ( type === 'span' ) {
				const mathtexView = writer.createContainerElement( 'span', {
					class: 'math-tex'
				} );

				if ( display ) {
					writer.insert( writer.createPositionAt( mathtexView, 0 ), writer.createText( '\\[' + equation + '\\]' ) );
				} else {
					writer.insert( writer.createPositionAt( mathtexView, 0 ), writer.createText( '\\(' + equation + '\\)' ) );
				}

				return mathtexView;
			} else {
				const mathtexView = writer.createContainerElement( 'script', {
					type: display ? 'math/tex; mode=display' : 'math/tex'
				} );

				writer.insert( writer.createPositionAt( mathtexView, 0 ), writer.createText( equation ) );

				return mathtexView;
			}
		}
	}
}
