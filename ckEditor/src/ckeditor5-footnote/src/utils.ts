import ModelElement from '@ckeditor/ckeditor5-engine/src/model/element';
import ModelText from '@ckeditor/ckeditor5-engine/src/model/text';
import ModelTextProxy from '@ckeditor/ckeditor5-engine/src/model/textproxy';
import ViewElement from '@ckeditor/ckeditor5-engine/src/view/element';
import ViewText from '@ckeditor/ckeditor5-engine/src/view/text';
import ViewTextProxy from '@ckeditor/ckeditor5-engine/src/view/textproxy';
import type { Editor } from '@ckeditor/ckeditor5-core';

// There's ample DRY violation in this file; type checking
// polymorphism without full typescript is just incredibly finicky.
// I (Jonathan) suspect there's a more elegant solution for this, 
// but I tried a lot of things and none of them worked.

/**
 * Returns an array of all descendant elements of
 * the root for which the provided predicate returns true.
 */
export const modelQueryElementsAll = (
	editor: Editor, 
	rootElement: ModelElement,
	predicate: (item: ModelElement) => boolean =(_) => true,
): ModelElement[] => {
	const range = editor.model.createRangeIn(rootElement);
	const output: ModelElement[] = [];

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
 */
export const modelQueryTextAll = (
	editor: Editor,
	rootElement: ModelElement,
	predicate: (item: ModelText|ModelTextProxy) => boolean =(_) => true,
): (ModelText|ModelTextProxy)[] => {
	const range = editor.model.createRangeIn(rootElement);
	const output: (ModelText|ModelTextProxy)[] = [];

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
 */
export const viewQueryElementsAll = (
	editor: Editor,
	rootElement: ViewElement,
	predicate: (item: ViewElement) => boolean =(_) => true,
): ViewElement[] => {
	const range = editor.editing.view.createRangeIn(rootElement);
	const output: ViewElement[] = [];

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
 */
export const viewQueryTextAll = (
	editor: Editor,
	rootElement: ViewElement,
	predicate: (item: ViewText|ViewTextProxy) => boolean = (_) => true,
): (ViewText|ViewTextProxy)[] => {
	const range = editor.editing.view.createRangeIn(rootElement);
	const output: (ViewText|ViewTextProxy)[] = [];

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
 */
export const modelQueryElement = (
	editor: Editor,
	rootElement: ModelElement,
	predicate: (item: ModelElement) => boolean = (_) => true,
): ModelElement|null => {
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
 */
export const modelQueryText = (
	editor: Editor,
	rootElement: ModelElement,
	predicate: (item: ModelText|ModelTextProxy) => boolean = (_) => true,
): ModelText|ModelTextProxy|null => {
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
 */
export const viewQueryElement = (
	editor: Editor,
	rootElement: ViewElement,
	predicate: (item: ViewElement) => boolean = (_) => true,
): ViewElement|null => {
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
 */
export const viewQueryText = (
	editor: Editor,
	rootElement: ViewElement,
	predicate: (item: ViewText|ViewTextProxy) => boolean = (_) => true,
): ViewText|ViewTextProxy|null => {
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
