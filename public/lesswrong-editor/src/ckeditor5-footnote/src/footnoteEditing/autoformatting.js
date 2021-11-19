// @ts-check
import inlineAutoformatEditing from '@ckeditor/ckeditor5-autoformat/src/inlineautoformatediting';
import { Editor } from '@ckeditor/ckeditor5-core';
import Element from '@ckeditor/ckeditor5-engine/src/model/element';
import Text from '@ckeditor/ckeditor5-engine/src/model/text';
import TextProxy from '@ckeditor/ckeditor5-engine/src/model/textproxy';
import Range from '@ckeditor/ckeditor5-engine/src/model/range';
import { modelQueryElement, modelQueryElementsAll } from '../utils';
import { COMMANDS, ELEMENTS } from '../constants';


/**
 * 
 * @param {Editor} editor 
 * @param {Element} rootElement 
 */
export const addFootnoteAutoformatting = (editor, rootElement) => {
	if(editor.plugins.has('Autoformat')) {
		const autoformatPluginInstance = editor.plugins.get('Autoformat');
		inlineAutoformatEditing(editor, autoformatPluginInstance, 
			regexMatchCallback, 
			(_, /**@type Range[]*/ ranges) => formatCallback(ranges, editor, rootElement)
			);
	}
}

/**
 * CKEditor's autoformatting feature has two opinionated default modes:
 * block autoformatting, which replaces the entire line, and inline autoformatting,
 * which expects a pair of delimters (which get removed) surrounding content which
 * gets formatted but not removed. Neither of those are ideal for this case:
 * we want to replace the matched text with a new element, without deleting the entire line.
 * 
 * However, inlineAutoformatEditing allows for passing in a custom callback to handle
 * regex matching, which also allows us to specify which sections to remove and
 * which sections pass on to the formatting callback. This method removes the entire
 * matched text, while passing the range of the numeric text on to the formatting callback.
 * 
 * If 0 or more than 1 match is found, it returns empty format and remove ranges. 
 * 
 * @param {string} text 
 * @returns {{remove: number[][], format: number[][]}}
 */
const regexMatchCallback = (text) => {
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
 * This callback takes in a range of text passed on by regexMatchCallback,
 * and attempts to insert a corresponding footnote reference at the current location.
 * 
 * Footnotes only get inserted if the matching range is an integer between 1 
 * and the number of existing footnotes + 1.
 * 
 * @param {Range[]} ranges 
 * @param {Editor} editor 
 * @param {Element} rootElement 
 * @returns {boolean|void} 
 */
const formatCallback = (ranges, editor, rootElement) => {
			const command = editor.commands.get(COMMANDS.insertFootnote);
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
			const footnoteSection = modelQueryElement(editor, rootElement, element => element.name === ELEMENTS.footnoteSection);
			if(!footnoteSection) {
				if(footnoteId !== 1) {
					return false;
				}
				editor.execute(COMMANDS.insertFootnote, { footnoteId: 0 });
				return;
			}
			const footnoteCount = modelQueryElementsAll(editor, footnoteSection, element =>  element.name === ELEMENTS.footnoteItem).length;
			if(footnoteId === footnoteCount + 1) {
				editor.execute(COMMANDS.insertFootnote, { footnoteId: 0 });
				return;
			}
			else if(footnoteId >= 1 && footnoteId <= footnoteCount) {
				editor.execute(COMMANDS.insertFootnote, { footnoteId: footnoteId })
				return;
			}
			return false;
		}
