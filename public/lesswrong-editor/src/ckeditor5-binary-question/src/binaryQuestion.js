// @ts-check (uses JSDoc types for type checking)

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import BinaryQuestionUI from './binaryQuestionUI';

export default class BinaryQuestion extends Plugin {
	static get requires() {
		return [BinaryQuestionUI]
	}
}
