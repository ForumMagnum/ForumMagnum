/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * This file is licensed under the terms of the MIT License (see LICENSE.md).
 */

import BalloonBlockEditorBase from '@ckeditor/ckeditor5-editor-balloon/src/ballooneditor';
import Alignment from '@ckeditor/ckeditor5-alignment/src/alignment';
import Autoformat from '@ckeditor/ckeditor5-autoformat/src/autoformat';
import BlockQuote from '@ckeditor/ckeditor5-block-quote/src/blockquote';
import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import CKFinder from '@ckeditor/ckeditor5-ckfinder/src/ckfinder';
import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import FontFamily from '@ckeditor/ckeditor5-font/src/fontfamily';
import FontSize from '@ckeditor/ckeditor5-font/src/fontsize';
import Heading from '@ckeditor/ckeditor5-heading/src/heading';
import Highlight from '@ckeditor/ckeditor5-highlight/src/highlight';
import Image from '@ckeditor/ckeditor5-image/src/image';
import ImageCaption from '@ckeditor/ckeditor5-image/src/imagecaption';
import ImageStyle from '@ckeditor/ckeditor5-image/src/imagestyle';
import ImageToolbar from '@ckeditor/ckeditor5-image/src/imagetoolbar';
import ImageUpload from '@ckeditor/ckeditor5-image/src/imageupload';
import ImageResize from '@ckeditor/ckeditor5-image/src/imageresize';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';
import Link from '@ckeditor/ckeditor5-link/src/link';
import List from '@ckeditor/ckeditor5-list/src/list';
// import MediaEmbed from '@ckeditor/ckeditor5-media-embed/src/mediaembed';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import PasteFromOffice from '@ckeditor/ckeditor5-paste-from-office/src/pastefromoffice';
import PresenceList from '@ckeditor/ckeditor5-real-time-collaboration/src/presencelist';
import RealTimeCollaborativeComments from '@ckeditor/ckeditor5-real-time-collaboration/src/realtimecollaborativecomments';
import RealTimeCollaborativeTrackChanges from '@ckeditor/ckeditor5-real-time-collaboration/src/realtimecollaborativetrackchanges';
import RemoveFormat from '@ckeditor/ckeditor5-remove-format/src/removeformat';
import Strikethrough from '@ckeditor/ckeditor5-basic-styles/src/strikethrough';
// import Table from '@ckeditor/ckeditor5-table/src/table';
// import TableToolbar from '@ckeditor/ckeditor5-table/src/tabletoolbar';
import Underline from '@ckeditor/ckeditor5-basic-styles/src/underline';
import UploadAdapter from '@ckeditor/ckeditor5-adapter-ckfinder/src/uploadadapter';
import BlockToolbar from '@ckeditor/ckeditor5-ui/src/toolbar/block/blocktoolbar';
import Autosave from '@ckeditor/ckeditor5-autosave/src/autosave'

import MathpreviewPlugin from 'ckeditor5-math-preview/src/mathpreview';

class CommentEditor extends BalloonBlockEditorBase {}
class PostEditor extends BalloonBlockEditorBase {}
class PostEditorCollaboration extends BalloonBlockEditorBase {}

// Tables and MediaEmbeds are commented out for now, but will be added back in as soon as some minor
// minor issues are debugged.

// NOTE: If you make changes to this file, you must:
// 1. navigate in your terminal to the corresponding folder ('cd ./public/lesswrong-editor')
// 2. 'yarn run build'
// 3. navigate back to main folder (i.e. 'cd ../..')
// 4. run 'yarn add ./public/lesswrong-editor'.

const headingOptions = {
	options: [
		{ model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
		{ model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
		{ model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
	]
};

const postEditorPlugins = [
	Autosave,
	Alignment,
	Autoformat,
	BlockToolbar,
	BlockQuote,
	Bold,
	CKFinder,
	Essentials,
	FontFamily,
	FontSize,
	Heading,
	Highlight,
	Image,
	ImageCaption,
	ImageStyle,
	ImageToolbar,
	ImageUpload,
	ImageResize,
	Italic,
	Link,
	List,
	// MediaEmbed,
	Paragraph,
	PasteFromOffice,
	RemoveFormat,
	Strikethrough,
	// Table,
	// TableToolbar,
	Underline,
	UploadAdapter,
	MathpreviewPlugin
];

PostEditor.builtinPlugins = [
	...postEditorPlugins
];

PostEditorCollaboration.builtinPlugins = [
	...postEditorPlugins,
	RealTimeCollaborativeComments,
	RealTimeCollaborativeTrackChanges,
	PresenceList
];

const postEditorConfig = {
	blockToolbar: [
		'heading',
		'|',
		'bulletedList',
		'numberedList',
		'imageUpload',
		'blockQuote',
		// 'insertTable',         these don't work yet, although I aim to fix them soon – Ray
		// 'mediaEmbed',
		'|',
		'undo',
		'redo',
		'|',
		'trackChanges'
	],
	toolbar: [
		'heading',
		'bold',
		'italic',
		'underline',
		'strikethrough',
		'highlight',
		'|',
		'alignment',
		'|',
		'link',
		'|',
		'mathpreview',
		'comment',
	],
	image: {
		toolbar: [
			'imageTextAlternative',
			'comment',
		],
	},
	heading: headingOptions
	// table: {
	// 	contentToolbar: [
	// 		'tableColumn',
	// 		'tableRow',
	// 		'mergeTableCells'
	// 	],
	// 	tableToolbar: [ 'comment' ]
	// },
	// mediaEmbed: {
	// 	toolbar: [ 'comment' ]
	// },
};

PostEditor.defaultConfig = {
	...postEditorConfig
};

PostEditorCollaboration.defaultConfig = {
	...postEditorConfig
};

CommentEditor.builtinPlugins = [
	Autosave,
	Alignment,
	Autoformat,
	BlockQuote,
	Bold,
	CKFinder,
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
	RemoveFormat,
	Strikethrough,
	// Table,
	Underline,
	UploadAdapter,
	MathpreviewPlugin
];

CommentEditor.defaultConfig = {
	toolbar: [
		'heading',
		'bold',
		'italic',
		'underline',
		'|',
		'bulletedList',
		'numberedList',
		'blockQuote',
		'|',
		'link',
		'|',
		'mathpreview'
	],
	image: {
		toolbar: [
			'imageTextAlternative'
		]
	},
	heading: headingOptions
	// table: {
	// 	contentToolbar: [
	// 		'tableColumn',
	// 		'tableRow',
	// 		'mergeTableCells'
	// 	],
	// 	tableToolbar: [ 'comment' ]
	// },
};

export const Editors = { CommentEditor, PostEditor, PostEditorCollaboration };
