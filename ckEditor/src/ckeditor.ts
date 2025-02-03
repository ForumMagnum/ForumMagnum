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
import CloudServicesPlugin from '@ckeditor/ckeditor5-cloud-services/src/cloudservices';
import ImageResize from '@ckeditor/ckeditor5-image/src/imageresize';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';
import Code from '@ckeditor/ckeditor5-basic-styles/src/code';
import Subscript from '@ckeditor/ckeditor5-basic-styles/src/subscript';
import Superscript from '@ckeditor/ckeditor5-basic-styles/src/superscript';
import CodeBlock from '@ckeditor/ckeditor5-code-block/src/codeblock';
import Link from '@ckeditor/ckeditor5-link/src/link';
import List from '@ckeditor/ckeditor5-list/src/list';
import ListProperties from '@ckeditor/ckeditor5-list/src/listproperties';
import MediaEmbed from '@ckeditor/ckeditor5-media-embed/src/mediaembed';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import PasteFromOffice from '@ckeditor/ckeditor5-paste-from-office/src/pastefromoffice';
import Mention from './ckeditor5-mention/src/mention';
import RealTimeCollaborativeEditing from '@ckeditor/ckeditor5-real-time-collaboration/src/realtimecollaborativeediting';

import RealTimeCollaborativeComments from '@ckeditor/ckeditor5-real-time-collaboration/src/realtimecollaborativecomments';
import { Comments } from '@ckeditor/ckeditor5-comments';
import RealTimeCollaborativeTrackChanges from '@ckeditor/ckeditor5-real-time-collaboration/src/realtimecollaborativetrackchanges';
import TrackChanges from '@ckeditor/ckeditor5-track-changes/src/trackchanges';
import TrackChangesData from '@ckeditor/ckeditor5-track-changes/src/trackchangesdata';

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
import Mathematics from './ckeditor5-math/math';
import Spoilers from './spoilers-plugin';
import CollapsibleSections from './collapsible-sections-plugin';
import ConditionalVisibility from './conditional-visibility-plugin';
import LLMAutocomplete from './llm-autocomplete';
import RestyledCommentButton from './restyled-comment-button-plugin';
import CTAButton from './ckeditor5-cta-button/cta-button';
import Footnote from './ckeditor5-footnote/src/footnote';
import UrlValidator from './url-validator-plugin';
import RemoveRedirect from './remove-redirect-plugin';
import DialogueCommentBox from './ckeditor5-dialogue-comments/dialogue-comment-box';
import InternalBlockLinks from './internal-block-links';

//
import { SanitizeTags } from './clean-styles-plugin'

import { postEditorConfig, commentEditorConfig } from './editorConfigs';
import {CloudinaryAdapterPlugin} from "./cloudinary"
import ClaimsPlugin from './claims';

export class CommentEditor extends BalloonBlockEditorBase {}
export class PostEditor extends BalloonBlockEditorBase {}
export class PostEditorCollaboration extends BalloonBlockEditorBase {}

// NOTE: If you make changes to this file, you must then run:
// `yarn run rebuild-ckeditor`

const sharedPlugins = [
	Autosave,
	Alignment,
	Autoformat,
	BlockQuote,
	Bold,
	CKFinder,
	Essentials,
	Heading,
	HorizontalLine,
	Image,
	ImageCaption,
	ImageStyle,
	ImageToolbar,
	EasyImage,
	ImageUpload,
	CloudServicesPlugin,
	ImageResize,
	Italic,
	Link,
	List,
	ListProperties,
	Code,
	CodeBlock,
	Subscript,
	Superscript,
	Paragraph,
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
	InternalBlockLinks,
	Spoilers,
	AutoLink,
	Footnote,
	Mention,
	UrlValidator,
	RemoveRedirect,
	CloudinaryAdapterPlugin,
	LLMAutocomplete,
	CTAButton,
	CollapsibleSections,
	ClaimsPlugin,
];

const postEditorPlugins = [
	...sharedPlugins,
	BlockToolbar,
	FontFamily,
	FontSize,
	ConditionalVisibility,
	// FontColor,
	// FontBackgroundColor,
];

const collaborativeEditorPlugins = [
	...postEditorPlugins,
	RestyledCommentButton,
	RealTimeCollaborativeEditing,
	RealTimeCollaborativeComments,
	Comments,
	RealTimeCollaborativeTrackChanges,
	TrackChanges,
	TrackChangesData,
	PresenceList,
	DialogueCommentBox
];

export function getPostEditor() {
  class PostEditor extends BalloonBlockEditorBase {}
  PostEditor.builtinPlugins = [ ...postEditorPlugins];
  PostEditor.defaultConfig = { ...postEditorConfig };
  return PostEditor;
}

// NOTE: do not attempt to forum-gate plugins being added to the bundle; it will break things
export function getPostEditorCollaboration() {
  class PostEditorCollaboration extends BalloonBlockEditorBase {}
  PostEditorCollaboration.builtinPlugins = [ ...collaborativeEditorPlugins];
  PostEditorCollaboration.defaultConfig = { ...postEditorConfig };
  return PostEditorCollaboration;
}

export function getCommentEditor() {
  class CommentEditor extends BalloonBlockEditorBase {}
  CommentEditor.builtinPlugins = [ ...sharedPlugins];
  CommentEditor.defaultConfig = { ...commentEditorConfig };
  return CommentEditor;
}
