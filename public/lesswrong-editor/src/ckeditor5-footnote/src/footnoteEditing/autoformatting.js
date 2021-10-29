// @ts-check
import inlineAutoformatEditing from '@ckeditor/ckeditor5-autoformat/src/inlineautoformatediting';
import { Editor } from '@ckeditor/ckeditor5-core';
import Element from '@ckeditor/ckeditor5-engine/src/model/element';
import Text from '@ckeditor/ckeditor5-engine/src/model/text';
import TextProxy from '@ckeditor/ckeditor5-engine/src/model/textproxy';
import Range from '@ckeditor/ckeditor5-engine/src/model/range';
import { modelQueryElement, modelQueryElementsAll } from '../utils';

export const addFootnoteAutoformatting = (editor, rootElement) => {
	if(editor.plugins.has('Autoformat')) {
		const autoformatPluginInstance = editor.plugins.get('Autoformat');
		inlineAutoformatEditing(editor, autoformatPluginInstance, 
			matchingCallback, 
			(_, /**@type Range[]*/ ranges) => formatCallback(ranges, editor, rootElement)
			);
	}
}

/**
 * @param {string} text 
 * @returns {{remove: number[][], format: number[][]}}
 */
const matchingCallback = (text) => {
	const results = text.match(/\[\^([0-9]+)\]/);
	if(results && results.length === 2) {
		const removeStart = text.indexOf(results[0])
		const removeEnd = removeStart + results[0].length;
		const formatStart = removeStart + 2;
		const formatEnd = formatStart + results[1].length;
		return {
			remove: [[removeStart, removeEnd]],
			format: [[formatStart, formatEnd]],
		}
	}
	return {
		remove: [],
		format: [],
	}
}

/**
 * 
 * @param {Range[]} ranges 
 * @param {Editor} editor 
 * @param {Element} rootElement 
 * @returns 
 */
const formatCallback = (ranges, editor, rootElement) => {
			const command = editor.commands.get('InsertFootnote');
			if(!command || !command.isEnabled) {
				return;
			}
			const textProxy = [...ranges[0].getItems()][0];
			if(!(textProxy instanceof TextProxy || textProxy instanceof Text)) {
				return false;
			}
			const match = textProxy.data.match(/[0-9]+/);
			if(!match) {
				return false;
			}
			const footnoteId = parseInt(match[0]);
			const footnoteSection = modelQueryElement(editor, rootElement, element => element.name === 'footnoteSection');
			if(!footnoteSection) {
				if(footnoteId !== 1) {
					return false;
				}
				editor.execute('InsertFootnote', { footnoteId: 0 });
				return;
			}
			const footnoteCount = modelQueryElementsAll(editor, footnoteSection, element =>  element.name === 'footnoteItem').length;
			if(footnoteId === footnoteCount + 1) {
				editor.execute('InsertFootnote', { footnoteId: 0 });
				return;
			}
			else if(footnoteId >= 1 && footnoteId <= footnoteCount) {
				editor.execute('InsertFootnote', { footnoteId: footnoteId })
				return;
			}
			return false;
		}
