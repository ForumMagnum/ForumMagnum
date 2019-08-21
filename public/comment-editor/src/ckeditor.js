/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * This file is licensed under the terms of the MIT License (see LICENSE.md).
 */

import React, { Component } from 'react';
import CKEditor from '@ckeditor/ckeditor5-react';

import BalloonBlockEditor from '@ckeditor/ckeditor5-editor-balloon/src/ballooneditor';

import Alignment from '@ckeditor/ckeditor5-alignment/src/alignment';
import Autoformat from '@ckeditor/ckeditor5-autoformat/src/autoformat';
import BlockQuote from '@ckeditor/ckeditor5-block-quote/src/blockquote';
import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import CKFinder from '@ckeditor/ckeditor5-ckfinder/src/ckfinder';
import EasyImage from '@ckeditor/ckeditor5-easy-image/src/easyimage';
import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import Heading from '@ckeditor/ckeditor5-heading/src/heading';
import Image from '@ckeditor/ckeditor5-image/src/image';
import ImageCaption from '@ckeditor/ckeditor5-image/src/imagecaption';
import ImageStyle from '@ckeditor/ckeditor5-image/src/imagestyle';
import ImageToolbar from '@ckeditor/ckeditor5-image/src/imagetoolbar';
import ImageUpload from '@ckeditor/ckeditor5-image/src/imageupload';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';
import Link from '@ckeditor/ckeditor5-link/src/link';
import List from '@ckeditor/ckeditor5-list/src/list';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import PasteFromOffice from '@ckeditor/ckeditor5-paste-from-office/src/pastefromoffice';
import Strikethrough from '@ckeditor/ckeditor5-basic-styles/src/strikethrough';
import Table from '@ckeditor/ckeditor5-table/src/table';
import Underline from '@ckeditor/ckeditor5-basic-styles/src/underline';
import UploadAdapter from '@ckeditor/ckeditor5-adapter-ckfinder/src/uploadadapter';
import Autosave from '@ckeditor/ckeditor5-autosave/src/autosave'

import MathpreviewPlugin from 'ckeditor5-math-preview/src/mathpreview';

const initialData = `
	<p> CKEditor test build </p>
`;

export default class Sample extends Component {
	render() {
		return (
			<div className="App">
				<div className="centered">
					{ this.renderEditor() }
				</div>
			</div>
		);
	}

	renderEditor() {
		const { data = initialData, onSave, onInit } = this.props;

		return (
			<div className="row row-editor">
				<CKEditor
					// onInit={ editor => {
					// 	console.log( 'Editor is ready', editor );
					// 	onInit && onInit( editor );
					// }}
					editor={ BalloonBlockEditor }
					config={ {
						autosave: {
							save( editor ) {
								return onSave( editor.getData() );
							}
						},
						plugins: [
							Autosave,
							Alignment,
							Autoformat,
							BlockQuote,
							Bold,
							CKFinder,
							EasyImage,
							Essentials,
							Heading,
							Image,
							ImageCaption,
							ImageStyle,
							ImageToolbar,
							ImageUpload,
							Italic,
							Link,
							List,
							Paragraph,
							PasteFromOffice,
							Strikethrough,
							Table,
							Underline,
							UploadAdapter,
							MathpreviewPlugin
						],
						toolbar: [
							'bold',
							'italic',
							'underline',
							'bulletedList',
							'numberedList',
							'|',
							'link',
							'|',
							'mathpreview'
						],
						image: {
							toolbar: [
								'imageStyle:full',
								'imageStyle:side',
								'|',
								'imageTextAlternative',
							]
						},
						table: {
							contentToolbar: [
								'tableColumn',
								'tableRow',
								'mergeTableCells'
							],
						},
					} }
					data={ data }
				/>
			</div>
		);
	}
}
