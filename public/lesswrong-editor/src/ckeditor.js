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
import EasyImage from '@ckeditor/ckeditor5-easy-image/src/easyimage';
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
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';
import Link from '@ckeditor/ckeditor5-link/src/link';
import List from '@ckeditor/ckeditor5-list/src/list';
import MediaEmbed from '@ckeditor/ckeditor5-media-embed/src/mediaembed';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import PasteFromOffice from '@ckeditor/ckeditor5-paste-from-office/src/pastefromoffice';
import PresenceList from '@ckeditor/ckeditor5-real-time-collaboration/src/presencelist';
import RealTimeCollaborativeComments from '@ckeditor/ckeditor5-real-time-collaboration/src/realtimecollaborativecomments';
import RealTimeCollaborativeTrackChanges from '@ckeditor/ckeditor5-real-time-collaboration/src/realtimecollaborativetrackchanges';
import RemoveFormat from '@ckeditor/ckeditor5-remove-format/src/removeformat';
import Strikethrough from '@ckeditor/ckeditor5-basic-styles/src/strikethrough';
import Table from '@ckeditor/ckeditor5-table/src/table';
import TableToolbar from '@ckeditor/ckeditor5-table/src/tabletoolbar';
import Underline from '@ckeditor/ckeditor5-basic-styles/src/underline';
import UploadAdapter from '@ckeditor/ckeditor5-adapter-ckfinder/src/uploadadapter';
import BlockToolbar from '@ckeditor/ckeditor5-ui/src/toolbar/block/blocktoolbar';
import Autosave from '@ckeditor/ckeditor5-autosave/src/autosave'

import MathpreviewPlugin from 'ckeditor5-math-preview/src/mathpreview';

class CommentEditor extends BalloonBlockEditorBase {}
class PostEditor extends BalloonBlockEditorBase {}

PostEditor.builtinPlugins = [
	Autosave,
	Alignment,
	Autoformat,
	BlockToolbar,
	BlockQuote,
	Bold,
	CKFinder,
	EasyImage,
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
	Italic,
	Link,
	List,
	MediaEmbed,
	Paragraph,
	PasteFromOffice,
	PresenceList,
	RealTimeCollaborativeComments,
	RealTimeCollaborativeTrackChanges,
	RemoveFormat,
	Strikethrough,
	Table,
	TableToolbar,
	Underline,
	UploadAdapter,
	MathpreviewPlugin
];

PostEditor.defaultConfig = {
	// autosave: {
	// 	save (editor) {
	// 		return onSave( editor.getData() )
	// 	}
	// },
	blockToolbar: [
		'heading',
		'|',
		'bulletedList',
		'numberedList',
		'imageUpload',
		'blockQuote',
		'insertTable',
		'mediaEmbed',
		'|',
		'undo',
		'redo',
		'|',
		'trackChanges'
	],
	toolbar: [
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
		'comment',
		'|',
		'mathpreview'
	],
	// cloudServices: {
	// 	tokenUrl: cloudServicesConfig.tokenUrl,
	// 	uploadUrl: cloudServicesConfig.uploadUrl,
	// 	webSocketUrl: cloudServicesConfig.webSocketUrl,
	// 	documentId: cloudServicesConfig.documentId
	// },
	image: {
		toolbar: [
			'imageStyle:full',
			'imageStyle:side',
			'|',
			'imageTextAlternative',
			'|',
			'comment'
		]
	},
	table: {
		contentToolbar: [
			'tableColumn',
			'tableRow',
			'mergeTableCells'
		],
		tableToolbar: [ 'comment' ]
	},
	mediaEmbed: {
		toolbar: [ 'comment' ]
	},
	// sidebar: {
	// 	container: this.sidebarElementRef.current
	// },
	// presenceList: {
	// 	container: this.presenceListElementRef.current
	// }
};

// export default class Sample extends Component {
// 	state = {
// 		// You need this state to render the <CKEditor /> component after the layout is ready.
// 		// <CKEditor /> needs HTMLElements of `Sidebar` and `PresenceList` plugins provided through
// 		// the `config` property and you have to ensure that both are already rendered.
// 		isLayoutReady: false
// 	};

// 	sidebarElementRef = React.createRef();
// 	presenceListElementRef = React.createRef();

// 	componentDidMount() {
// 		// When the layout is ready you can switch the state and render the `<CKEditor />` component.
// 		this.setState( { isLayoutReady: true } );
// 	}

// 	render() {
// 		return (
// 			<div className="App">
// 				<div className="centered">
// 					<div className="row-presence">
// 						<div ref={ this.presenceListElementRef } className="presence"></div>
// 					</div>
// 					{ this.renderEditor() }
// 					<div ref={ this.sidebarElementRef } className="sidebar"></div>
// 				</div>
// 			</div>
// 		);
// 	}

// 	renderEditor() {
// 		const { data = initialData, configuration: cloudServicesConfig, onSave } = this.props

// 		return (
// 			<div className="row row-editor">
// 				{ /* Do not render the <CKEditor /> component before the layout is ready. */ }
// 				{ this.state.isLayoutReady && (
// 					<CKEditor
// 						onReady={ this.onEditorReady }
// 						editor={  }
// 						config={ {
							
// 						} }
// 						data={ data }
// 					/>
// 				) }
// 			</div>
// 		);
// 	}

// 	refreshDisplayMode( editor ) {
// 		const annotations = editor.plugins.get( 'Annotations' );
// 		const sidebarElement = this.sidebarElementRef.current;

// 		if ( window.innerWidth < 1000 ) {
// 			sidebarElement.classList.remove( 'narrow' );
// 			sidebarElement.classList.add( 'hidden' );
// 			annotations.switchTo( 'inline' );
// 		}
// 		else if ( window.innerWidth < 1300 ) {
// 			sidebarElement.classList.remove( 'hidden' );
// 			sidebarElement.classList.add( 'narrow' );
// 			annotations.switchTo( 'narrowSidebar' );
// 		}
// 		else {
// 			sidebarElement.classList.remove( 'hidden', 'narrow' );
// 			annotations.switchTo( 'wideSidebar' );
// 		}
// 	}

// 	componentWillUnmount() {
// 		window.removeEventListener( 'resize', this.boundRefreshDisplayMode );
// 	}
// }

CommentEditor.builtinPlugins = [
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
	RemoveFormat,
	Strikethrough,
	Table,
	Underline,
	UploadAdapter,
	MathpreviewPlugin
];

CommentEditor.defaultConfig = {
	// autosave: {
	// 	save (editor) {
	// 		return onSave( editor.getData() )
	// 	}
	// },
	blockToolbar: [
		'heading',
		'|',
		'bulletedList',
		'numberedList',
		'imageUpload',
		'blockQuote',
	],
	toolbar: [
		'bold',
		'italic',
		'underline',
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
			'imageTextAlternative'
		]
	},
	table: {
		contentToolbar: [
			'tableColumn',
			'tableRow',
			'mergeTableCells'
		],
		tableToolbar: [ 'comment' ]
	},
};

console.log( 'Exporting editors: ', CommentEditor, PostEditor )

export const Editors = { CommentEditor, PostEditor };
