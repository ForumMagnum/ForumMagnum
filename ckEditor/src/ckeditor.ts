/* eslint-disable no-tabs */
/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * This file is licensed under the terms of the MIT License (see LICENSE.md).
 */

import {
  BalloonEditor as BalloonBlockEditorBase,
  Alignment,
  Autoformat,
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
  EasyImage,
  Image,
  ImageCaption,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  CloudServices as CloudServicesPlugin,
  ImageResize,
  Italic,
  Code,
  Subscript,
  Superscript,
  CodeBlock,
  Link,
  List,
  ListProperties,
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
  CKFinderUploadAdapter as UploadAdapter,
  BlockToolbar,
  Autosave,
  AutoLink,
} from 'ckeditor5';
import {
  RealTimeCollaborativeEditing,
  RealTimeCollaborativeComments,
  Comments,
  RealTimeCollaborativeTrackChanges,
  TrackChanges,
  TrackChangesData,
  PresenceList,
} from 'ckeditor5-premium-features';
import Mention from './ckeditor5-mention/src/mention';
import Mathematics from './ckeditor5-math/math';
import Spoilers from './spoilers-plugin';
import CollapsibleSections from './collapsible-sections-plugin';
import ConditionalVisibility from './conditional-visibility-plugin';
import LLMAutocomplete from './llm-autocomplete';
import RestyledCommentButton from './restyled-comment-button-plugin';
import CTAButton from './ckeditor5-cta-button/cta-button';
import PollPlugin from './ckeditor5-poll/poll';
import Footnote from './ckeditor5-footnote/src/footnote';
import UrlValidator from './url-validator-plugin';
import RemoveRedirect from './remove-redirect-plugin';
import DialogueCommentBox from './ckeditor5-dialogue-comments/dialogue-comment-box';
import InternalBlockLinks from './internal-block-links';
import LLMPostEditing from './llm-editing';

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
  PollPlugin,
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
  DialogueCommentBox,
  LLMPostEditing
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
