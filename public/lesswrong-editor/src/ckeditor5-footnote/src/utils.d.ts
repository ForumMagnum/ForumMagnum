import ModelElement from '@ckeditor/ckeditor5-engine/src/model/element';
import ViewElement from '@ckeditor/ckeditor5-engine/src/view/element';
import ModelText from '@ckeditor/ckeditor5-engine/src/model/text';
import ViewText from '@ckeditor/ckeditor5-engine/src/view/text';
import { Editor } from '@ckeditor/ckeditor5-core';

type Constructor<T extends {editor: Editor}> = new (...args: any[]) => T;
type QueryPredicate<U> = (element: U) => boolean;

enum Mode {
	MODEL='model',
	VIEW='view',
}
enum ItemType {
	ELEMENT='element',
	TEXT='text',
}

type Types = {
	[Mode.MODEL]: {
		[ItemType.ELEMENT]: ModelElement,
		[ItemType.TEXT]: ModelText,
	},
	[Mode.VIEW]: {
		[ItemType.ELEMENT]: ViewElement,
		[ItemType.VIEW]: ViewText,
	},
}

type QueryDescendantsAll<M extends Mode, I extends ItemType> = ({root, predicate, type=ItemType.ELEMENT}: {
	root: Types[M]['element'],
	predicate: (item: Types[M][I]) => boolean,
	type?: I,
}) => Types[M][I][];

type QueryDescendantFirst<M extends Mode, I extends ItemType> = ({root, predicate, type=ItemType.ELEMENT}: {
	root: Types[M]['element'],
	predicate: (item: Types[M][I]) => boolean,
	type?: I,
}) => Types[M][I]|null;

/** 
 * Returns a list of all descendants of the root for which the provided 
 * predicate returns true. 
 */
type WithQueryMixin<T> = T & Constructor<{
	queryDescendantsAll: QueryDescendantsAll,
	queryDescendantFirst: QueryDescendantFirst,
}>
export declare const QueryMixin: <TBaseClass extends Constructor> (BaseClass: TBaseClass) => WithQueryMixin<TBaseClass>;
