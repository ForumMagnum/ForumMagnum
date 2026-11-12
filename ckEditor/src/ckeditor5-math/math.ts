import { loadMathJax } from './loadMathjax.js';
import { Plugin, Widget } from 'ckeditor5';

import MathUI from './mathui';
import MathEditing from './mathediting';
import AutoMath from './automath';

export type MathConfig = {
	engine: "mathjax"
	outputType: "span"|"script"
	forceOutputType: boolean
	enablePreview: boolean
}

export default class Math extends Plugin {
	static get requires() {
		return [ MathEditing, MathUI, AutoMath, Widget ];
	}

	static get pluginName() {
		return 'Math';
	}

	init() {
		loadMathJax();
	}
}
