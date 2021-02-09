/* eslint-disable no-tabs */
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
// import FontColor from '@ckeditor/ckeditor5-font/src/fontcolor';
// import FontBackgroundColor from '@ckeditor/ckeditor5-font/src/fontbackgroundcolor';
import Heading from '@ckeditor/ckeditor5-heading/src/heading';
import HorizontalLine from '@ckeditor/ckeditor5-horizontal-line/src/horizontalline';
import EasyImage from '@ckeditor/ckeditor5-easy-image/src/easyimage';
import Image from '@ckeditor/ckeditor5-image/src/image';
import ImageCaption from '@ckeditor/ckeditor5-image/src/imagecaption';
import ImageStyle from '@ckeditor/ckeditor5-image/src/imagestyle';
import ImageToolbar from '@ckeditor/ckeditor5-image/src/imagetoolbar';
import ImageUpload from '@ckeditor/ckeditor5-image/src/imageupload';
import ImageResize from '@ckeditor/ckeditor5-image/src/imageresize';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';
import Code from '@ckeditor/ckeditor5-basic-styles/src/code';
import Subscript from '@ckeditor/ckeditor5-basic-styles/src/subscript';
import Superscript from '@ckeditor/ckeditor5-basic-styles/src/superscript';
import CodeBlock from '@ckeditor/ckeditor5-code-block/src/codeblock';
import Link from '@ckeditor/ckeditor5-link/src/link';
import List from '@ckeditor/ckeditor5-list/src/list';
import MediaEmbed from '@ckeditor/ckeditor5-media-embed/src/mediaembed';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import PasteFromOffice from '@ckeditor/ckeditor5-paste-from-office/src/pastefromoffice';
import RealTimeCollaborativeEditing from '@ckeditor/ckeditor5-real-time-collaboration/src/realtimecollaborativeediting';

// The following plugin enables real-time collaborative comments.
// You do not need to import it if you do not want to integrate it.
import RealTimeCollaborativeComments from '@ckeditor/ckeditor5-real-time-collaboration/src/realtimecollaborativecomments';

// The following plugin enables real-time collaborative track changes and is optional.
// You do not need to import it if you do not want to integrate it.
import RealTimeCollaborativeTrackChanges from '@ckeditor/ckeditor5-real-time-collaboration/src/realtimecollaborativetrackchanges';

// The following plugin enables users presence list and is optional.
// You do not need to import it if you do not want to integrate it.
import PresenceList from '@ckeditor/ckeditor5-real-time-collaboration/src/presencelist';
import RemoveFormat from '@ckeditor/ckeditor5-remove-format/src/removeformat';
import Strikethrough from '@ckeditor/ckeditor5-basic-styles/src/strikethrough';
import Table from '@ckeditor/ckeditor5-table/src/table';
import TableToolbar from '@ckeditor/ckeditor5-table/src/tabletoolbar';
import TableProperties from '@ckeditor/ckeditor5-table/src/tableproperties';
import TableCellProperties from '@ckeditor/ckeditor5-table/src/tablecellproperties';
import Underline from '@ckeditor/ckeditor5-basic-styles/src/underline';
import UploadAdapter from '@ckeditor/ckeditor5-adapter-ckfinder/src/uploadadapter';
import BlockToolbar from '@ckeditor/ckeditor5-ui/src/toolbar/block/blocktoolbar';
import Autosave from '@ckeditor/ckeditor5-autosave/src/autosave';
import AutoLink from '@ckeditor/ckeditor5-link/src/autolink';
import EditorWatchdog from '@ckeditor/ckeditor5-watchdog/src/editorwatchdog';
import Mathematics from './ckeditor5-math/math';
import Spoilers from './spoilers-plugin';
//
import { SanitizeTags } from './clean-styles-plugin'

class CommentEditor extends BalloonBlockEditorBase {}
class PostEditor extends BalloonBlockEditorBase {}
class PostEditorCollaboration extends BalloonBlockEditorBase {}

// NOTE: If you make changes to this file, you must:
// 1. navigate in your terminal to the corresponding folder ('cd ./public/lesswrong-editor')
// 2. 'yarn run build'
// 3. navigate back to main folder (i.e. 'cd ../..')
// 4. run 'yarn add ./public/lesswrong-editor'.
//
// alternately, you could run `yarn rebuild-reinstall-ckeditor` to do all of the above at once

const headingOptions = {
	options: [
		{ model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
		{ model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
		{ model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
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
	// FontColor,
	// FontBackgroundColor,
	Heading,
	HorizontalLine,
	Image,
	ImageCaption,
	ImageStyle,
	ImageToolbar,
	EasyImage,
	ImageUpload,
	ImageResize,
	Italic,
	Link,
	List,
	Code,
	CodeBlock,
	Subscript,
	Superscript,
	MediaEmbed,
	Paragraph,
	PasteFromOffice,
	RemoveFormat,
	Strikethrough,
	Table,
	TableToolbar,
	TableProperties,
	TableCellProperties,
	Underline,
	UploadAdapter,
	Mathematics,
	SanitizeTags,
	Spoilers,
	AutoLink
];

PostEditor.builtinPlugins = [
	...postEditorPlugins
];

PostEditorCollaboration.builtinPlugins = [
	...postEditorPlugins,
	RealTimeCollaborativeEditing,
	RealTimeCollaborativeComments,
	RealTimeCollaborativeTrackChanges,
	PresenceList
];

const mathConfig = {
	engine: 'mathjax',
	outputType: 'span',
	forceOutputType: true,
	enablePreview: true
}

const embedConfig = {
	toolbar: [ 'comment' ],
	previewsInData: true,
	removeProviders: [ 'instagram', 'twitter', 'googleMaps', 'flickr', 'facebook', 'spotify', 'vimeo', 'dailymotion'],
	extraProviders: [
		{
			name: 'Elicit',
			url: /^elicit.org\/binary\/questions\/([a-zA-Z0-9_-]+)/,
			html: ([match, questionId]) => `
				<div data-elicit-id="${questionId}" style="position:relative;height:50px;background-color: rgba(0,0,0,0.05);display: flex;justify-content: center;align-items: center;" class="elicit-binary-prediction">
					<div style=>Elicit Prediction (<a href="${match}">${match}</a>)</div>
				</div>
			`
		},
		{
			name: 'Metaculus',
			url: /^metaculus\.com\/questions\/([a-zA-Z0-9]{1,6})?/,
			html: ([match, questionNumber]) => `
				<div data-metaculus-id="${questionNumber}" style="background-color: #2c3947;" class="metaculus-preview">
					<iframe style="height: 400px; width: 100%; border: none;" src="https://d3s0w6fek99l5b.cloudfront.net/s/1/questions/embed/${questionNumber}/?plot=pdf"/>
				</div>
			`
		}
	]
}

const postEditorConfig = {
	blockToolbar: [
		'imageUpload',
		'insertTable',
		'horizontalLine',
		'mathDisplay',
		'mediaEmbed'
	],
	toolbar: [
		'heading',
		'|',
		'bold',
		'italic',
		'strikethrough',
		'|',
		'alignment',
		'|',
		'link',
		'|',
		'blockQuote',
		'bulletedList',
		'numberedList',
		'codeBlock',
		'|',
		'trackChanges',
		'comment',
		'math'
	],
	image: {
		toolbar: [
			'imageTextAlternative',
			'comment',
		],
	},
	heading: headingOptions,
	table: {
		contentToolbar: [
			'tableColumn', 'tableRow', 'mergeTableCells',
			'tableProperties', 'tableCellProperties'
		],
		tableToolbar: [ 'comment' ]
	},
	math: mathConfig,
	mediaEmbed: embedConfig,
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
	HorizontalLine,
	EasyImage,
	Image,
	ImageCaption,
	ImageStyle,
	ImageToolbar,
	ImageUpload,
	ImageResize,
	Italic,
	Link,
	List,
	Paragraph,
	Code,
	CodeBlock,
	Subscript,
	Superscript,
	MediaEmbed,
	PasteFromOffice,
	RemoveFormat,
	Strikethrough,
	Table,
	TableToolbar,
	TableProperties,
	TableCellProperties,
	Underline,
	UploadAdapter,
	Mathematics,
	SanitizeTags,
	Spoilers,
	AutoLink
];

CommentEditor.defaultConfig = {
	toolbar: [
		'heading',
		'|',
		'bold',
		'italic',
		'strikethrough',
		'|',
		'link',
		'|',
		'blockQuote',
		'bulletedList',
		'numberedList',
		'|',
		'math'
	],
	image: {
		toolbar: [
			'imageTextAlternative'
		]
	},
	heading: headingOptions,
	table: {
		contentToolbar: [
			'tableColumn', 'tableRow', 'mergeTableCells',
			'tableProperties', 'tableCellProperties'
		],
		tableToolbar: [ 'comment' ]
	},
	math: mathConfig,
	mediaEmbed: embedConfig,
};

export const Editors = { CommentEditor, PostEditor, PostEditorCollaboration, EditorWatchdog };
