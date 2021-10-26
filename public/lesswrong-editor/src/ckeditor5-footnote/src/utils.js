// @ts-check
import ModelElement from '@ckeditor/ckeditor5-engine/src/model/element';
import ModelText from '@ckeditor/ckeditor5-engine/src/model/text';
import ViewElement from '@ckeditor/ckeditor5-engine/src/view/element';
import ViewText from '@ckeditor/ckeditor5-engine/src/view/text';

export const QueryMixin = BaseClass => class extends BaseClass {
	/**
	 * Returns a list of all descendants of the root for which the provided 
	 * predicate returns true. 
	 */
	queryDescendantsAll ({ rootElement, predicate=_ => true, type='element' }) {
		const output = [];

		const [mode, range] = rootElement instanceof ViewElement ?
			['view', this.editor.editing.view.createRangeIn(rootElement)]:
			['model', this.editor.model.createRangeIn(rootElement)];

		const types = {
			'model': {
				'element': ModelElement,
				'text': ModelText,
			},
			'view': {
				'element': ViewElement,
				'text': ViewText,
			}
		}

		for(const item of range.getItems()) {
			if (!item || !(item instanceof types[mode][type])) {
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
	 */
	queryDescendantFirst ({ rootElement, predicate=_ => true, type='element' }) {
		const [mode, range] = rootElement instanceof ViewElement ?
			['view', this.editor.editing.view.createRangeIn(rootElement)]:
			['model', this.editor.model.createRangeIn(rootElement)];

		const types = {
			'model': {
				'element': ModelElement,
				'text': ModelText,
			},
			'view': {
				'element': ViewElement,
				'text': ViewText,
			}
		}

		for(const item of range.getItems()) {
			if (!(item instanceof types[mode][type])) {

				continue;
			}
			if (predicate(item)) {
				return item;
			}
		}

		return null;
	}
}
