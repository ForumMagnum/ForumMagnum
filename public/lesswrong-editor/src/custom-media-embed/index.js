// https://github.com/ckeditor/ckeditor5/blob/30286f77b39526fce2856b03b9be0ba4cc91d1c7/packages/ckeditor5-media-embed/src/mediaembedui.js
/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module media-embed/mediaembedui
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { createDropdown } from '@ckeditor/ckeditor5-ui/src/dropdown/utils';

import MediaFormView from './media-form-view-custom';
import MediaEmbedEditing from '@ckeditor/ckeditor5-media-embed/src/mediaembedediting';
import mediaIcon from '@ckeditor/ckeditor5-media-embed/theme/icons/media.svg';

/**
 * The media embed UI plugin.
 *
 * @extends module:core/plugin~Plugin
 */
export default class MediaEmbedUICustom extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ MediaEmbedEditing ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'MediaEmbedUICustom';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const command = editor.commands.get( 'mediaEmbed' );
		const registry = editor.plugins.get( MediaEmbedEditing ).registry;

		editor.ui.componentFactory.add( 'mediaEmbedCustom', locale => {
			const dropdown = createDropdown( locale );

			const mediaForm = new MediaFormView( getFormValidators( editor.t, registry ), editor.locale );

			this._setUpDropdown( dropdown, mediaForm, command, editor );
			this._setUpForm( dropdown, mediaForm, command );

			return dropdown;
		} );
	}

	/**
	 * @private
	 * @param {module:ui/dropdown/dropdownview~DropdownView} dropdown
	 * @param {module:ui/view~View} form
	 * @param {module:media-embed/mediaembedcommand~MediaEmbedCommand} command
	 */
	_setUpDropdown( dropdown, form, command ) {
		const editor = this.editor;
		const t = editor.t;
		const button = dropdown.buttonView;

		dropdown.bind( 'isEnabled' ).to( command );
		dropdown.panelView.children.add( form );

		button.set( {
			label: t( 'Insert media' ),
			icon: mediaIcon,
			tooltip: true
		} );

		// Note: Use the low priority to make sure the following listener starts working after the
		// default action of the drop-down is executed (i.e. the panel showed up). Otherwise, the
		// invisible form/input cannot be focused/selected.
		button.on( 'open', () => {
			form.disableCssTransitions();

			// Make sure that each time the panel shows up, the URL field remains in sync with the value of
			// the command. If the user typed in the input, then canceled (`urlInputView#fieldView#value` stays
			// unaltered) and re-opened it without changing the value of the media command (e.g. because they
			// didn't change the selection), they would see the old value instead of the actual value of the
			// command.
			form.url = command.value || '';
			form.urlInputView.fieldView.select();
			form.focus();
			form.enableCssTransitions();
		}, { priority: 'low' } );

		dropdown.on( 'submit', () => {
			if ( form.isValid() ) {
				editor.execute( 'mediaEmbed', form.url );
				closeUI();
			}
		} );

		dropdown.on( 'change:isOpen', () => form.resetFormStatus() );
		dropdown.on( 'cancel', () => closeUI() );

		function closeUI() {
			editor.editing.view.focus();
			dropdown.isOpen = false;
		}
	}

	/**
	 * @private
	 * @param {module:ui/dropdown/dropdownview~DropdownView} dropdown
	 * @param {module:ui/view~View} form
	 * @param {module:media-embed/mediaembedcommand~MediaEmbedCommand} command
	 */
	_setUpForm( dropdown, form, command ) {
		form.delegate( 'submit', 'cancel' ).to( dropdown );
		form.urlInputView.bind( 'value' ).to( command, 'value' );

		// Form elements should be read-only when corresponding commands are disabled.
		form.urlInputView.bind( 'isReadOnly' ).to( command, 'isEnabled', value => !value );
	}
}

function getFormValidators( t, registry ) {
	return [
		form => {
			if ( !form.url.length ) {
				return t( 'The URL must not be empty.' );
			}
		},
		form => {
			if ( !registry.hasMedia( form.url ) ) {
				return t( 'This media URL is not supported.' );
			}
		}
	];
}
