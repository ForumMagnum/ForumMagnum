// @ts-check (uses JSDoc types for type checking)

import ModelElement from '@ckeditor/ckeditor5-engine/src/model/element';
import ModelText from '@ckeditor/ckeditor5-engine/src/model/text';
import ModelTextProxy from '@ckeditor/ckeditor5-engine/src/model/textproxy';
import ViewElement from '@ckeditor/ckeditor5-engine/src/view/element';
import ViewText from '@ckeditor/ckeditor5-engine/src/view/text';
import ViewTextProxy from '@ckeditor/ckeditor5-engine/src/view/textproxy';
import { Editor } from '@ckeditor/ckeditor5-core';

// There's ample DRY violation in this file; type checking
// polymorphism without full typescript is just incredibly finicky.
// I (Jonathan) suspect there's a more elegant solution for this, 
// but I tried a lot of things and none of them worked.

/**
 * Returns an array of all descendant elements of
 * the root for which the provided predicate returns true.
 * @param {Editor} editor
 * @param {ModelElement} rootElement  
 * @param {(item: ModelElement) => boolean} predicate
 * @returns {ModelElement[]} */
 export const modelQueryElementsAll = (
	editor, 
	rootElement,
	predicate=(_) => true,
) => {
	const range = editor.model.createRangeIn(rootElement);
	const output = [];

	for(const item of range.getItems()) {
		if (!(item instanceof ModelElement)) {
			continue;
		}

		if (predicate(item)) {
			output.push(item);
		}
	}
	return output;
} 

/**
 * Returns an array of all descendant text nodes and text proxies of
 * the root for which the provided predicate returns true.
 * @param {Editor} editor
 * @param {ModelElement} rootElement  
 * @param {(item: ModelText|ModelTextProxy) => boolean} predicate
 * @returns {(ModelText|ModelTextProxy)[]} */
 export const modelQueryTextAll = (
	editor, 
	rootElement,
	predicate=(_) => true,
) => {
	const range = editor.model.createRangeIn(rootElement);
	const output = [];

	for(const item of range.getItems()) {
		if (!(item instanceof ModelText || item instanceof ModelTextProxy)) {
			continue;
		}

		if (predicate(item)) {
			output.push(item);
		}
	}
	return output;
} 

/**
 * Returns an array of all descendant elements of
 * the root for which the provided predicate returns true.
 * @param {Editor} editor
 * @param {ViewElement} rootElement  
 * @param {(item: ViewElement) => boolean} predicate
 * @returns {ViewElement[]} */
 export const viewQueryElementsAll = (
	editor, 
	rootElement,
	predicate=(_) => true,
) => {
	const range = editor.editing.view.createRangeIn(rootElement);
	const output = [];

	for(const item of range.getItems()) {
		if (!(item instanceof ViewElement)) {
			continue;
		}

		if (predicate(item)) {
			output.push(item);
		}
	}
	return output;
} 

/**
 * Returns an array of all descendant text nodes and text proxies of
 * the root for which the provided predicate returns true.
 * @param {Editor} editor
 * @param {ViewElement} rootElement  
 * @param {(item: ViewText|ViewTextProxy) => boolean} predicate
 * @returns {(ViewText|ViewTextProxy)[]} */
 export const viewQueryTextAll = (
	editor, 
	rootElement,
	predicate=(_) => true,
) => {
	const range = editor.editing.view.createRangeIn(rootElement);
	const output = [];

	for(const item of range.getItems()) {
		if (!(item instanceof ViewText || item instanceof ViewTextProxy)) {
			continue;
		}

		if (predicate(item)) {
			output.push(item);
		}
	}
	return output;
} 

/**
 * Returns the first descendant element of the root for which the provided
 * predicate returns true, or null if no such element is found.
 * @param {Editor} editor
 * @param {ModelElement} rootElement  
 * @param {(item: ModelElement) => boolean} predicate
 * @returns {ModelElement|null} */
export const modelQueryElement = (
	editor, 
	rootElement,
	predicate=(_) => true,
) => {
	const range = editor.model.createRangeIn(rootElement);

	for(const item of range.getItems()) {
		if (!(item instanceof ModelElement)) {
			continue;
		}

		if (predicate(item)) {
			return item;
		}
	}
	return null;
} 

/**
 * Returns the first descendant text node or text proxy of the root for which the provided
 * predicate returns true, or null if no such element is found.
 * @param {Editor} editor
 * @param {ModelElement} rootElement  
 * @param {(item: ModelText|ModelTextProxy) => boolean} predicate
 * @returns {ModelText|ModelTextProxy|null} */
export const modelQueryText = (
	editor, 
	rootElement,
	predicate=(_) => true,
) => {
	const range = editor.model.createRangeIn(rootElement);

	for(const item of range.getItems()) {
		if (!(item instanceof ModelText || item instanceof ModelTextProxy)) {
			continue;
		}

		if (predicate(item)) {
			return item;
		}
	}
	return null;
} 

/**
 * Returns the first descendant element of the root for which the provided
 * predicate returns true, or null if no such element is found.
 * @param {Editor} editor
 * @param {ViewElement} rootElement  
 * @param {(item: ViewElement) => boolean} predicate
 * @returns {ViewElement|null} */
 export const viewQueryElement = (
	editor, 
	rootElement,
	predicate=(_) => true,
) => {
	const range = editor.editing.view.createRangeIn(rootElement);

	for(const item of range.getItems()) {
		if (!(item instanceof ViewElement)) {
			continue;
		}

		if (predicate(item)) {
			return item;
		}
	}
	return null;
} 

/**
 * Returns the first descendant text node or text proxy of the root for which the provided
 * predicate returns true, or null if no such element is found.
 * @param {Editor} editor
 * @param {ViewElement} rootElement  
 * @param {(item: ViewText|ViewTextProxy) => boolean} predicate
 * @returns {ViewText|ViewTextProxy|null} */
 export const viewQueryText = (
	editor, 
	rootElement,
	predicate=(_) => true,
) => {
	const range = editor.editing.view.createRangeIn(rootElement);

	for(const item of range.getItems()) {
		if (!(item instanceof ViewText || item instanceof ViewTextProxy)) {
			continue;
		}

		if (predicate(item)) {
			return item;
		}
	}
	return null;
} 
