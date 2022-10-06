import { Plugin } from 'ckeditor5/src/core';

import MentionCommand from './mentioncommand';

/**
 * It introduces the {@link module:mention/mentioncommand~MentionCommand command}
 * TODO: potentially merge with mention.js on completing https://github.com/ForumMagnum/ForumMagnum/issues/4906
 *
 * @extends module:core/plugin~Plugin
 */
export default class MentionEditing extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'MentionEditing';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;

		editor.commands.add( 'mention', new MentionCommand( editor ) );
	}
}
