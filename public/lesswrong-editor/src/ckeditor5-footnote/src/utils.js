// @ts-check
import Element from '@ckeditor/ckeditor5-engine/src/model/element';
import { Editor } from '@ckeditor/ckeditor5-core';

/** 
 * @callback QueryPredicate
 * @param {Element} element
 * @returns {boolean}
 */

/**
 * @template T
 * @typedef {new (...args: any[]) => T} Constructor<T>
 */

/**
 * @template {Constructor<{editor: Editor}>} BaseClassType
 * @param {BaseClassType} BaseClass
 * @mixin
 */
export const QueryMixin = BaseClass => class extends BaseClass {
	/**
	 * Returns a list of all descendants of the root for which the provided 
	 * predicate returns true.
	 * 
	 * @param {Element} root 
	 * @param {QueryPredicate} predicate 
	 * @returns {Element[]}
	 */
	queryDescendantsAll (root, predicate) {
		const range = this.editor.model.createRangeIn(root);
		const output = [];

		for(const item of range.getItems()) {
			// filter out Text and TextProxy items
			if (!(item instanceof Element)) {
				continue;
			}

			if (predicate(item)) {
				output.push(item);
			}
		}

		return output;
	}

	/**
	 * Returns the first descendant of the root for which the provided predicate
	 * returns true, or null if no such descendant is found.
	 * 
	 * @param {Element} root 
	 * @param {QueryPredicate} predicate 
	 * @returns {(Element|null)}
	 */
	queryDescendantFirst (root, predicate) {
		const range = this.editor.model.createRangeIn(root);

		for(const item of range.getItems()) {
			// filter out Text and TextProxy items
			if (!(item instanceof Element)) {
				continue;
			}
			if (predicate(item)) {
				return item;
			}
		}

		return null;
	}

	/**
	 * Returns the first descendant of the root for which the provided predicate
	 * returns true, or null if no such descendant is found.
	 * 
	 * @param {Element} root 
	 * @param {QueryPredicate} predicate 
	 * @returns {boolean}
	 */
	queryHasDescendant (root, predicate) {
		const range = this.editor.model.createRangeIn(root);

		for(const item of range.getItems()) {
			// filter out Text and TextProxy items
			if (!(item instanceof Element)) {
				continue;
			}
			if (predicate(item)) {
				return true;
			}
		}

		return false;
	}
};
