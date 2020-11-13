/** Helpers to get values depending on name
 * E.g. retrieving a collection and its name when only one value is provided
 *
 */

import { getCollection } from './collections';
import { getFragment, getFragmentName } from './fragments';
/**
 * Extract collectionName from collection
 * or collection from collectionName
 * @param {*} param0
 */
export const extractCollectionInfo = ({ collectionName, collection }: {
  collectionName: CollectionNameString|undefined,
  collection: CollectionBase<any>|undefined,
}): {
  collection: CollectionBase<any>,
  collectionName: CollectionNameString,
}=> {
  if (!(collectionName || collection)) throw new Error('Please specify either collection or collectionName');
  const _collectionName: CollectionNameString = collectionName || collection!.options.collectionName;
  const _collection = collection || getCollection(_collectionName);
  return { collection: _collection, collectionName: _collectionName };
};
/**
 * Extract fragmentName from fragment
 * or fragment from fragmentName
 */
export const extractFragmentInfo = ({ fragment, fragmentName }: { fragment: any|undefined, fragmentName: FragmentName|undefined }, collectionName: CollectionNameString): {
  fragment: any,
  fragmentName: FragmentName,
} => {
  if (!(fragment || fragmentName || collectionName))
    throw new Error('Please specify either fragment or fragmentName, or pass a collectionName');
  if (fragment) {
    return {
      fragment,
      fragmentName: fragmentName || getFragmentName(fragment)
    };
  } else {
    const _fragmentName = fragmentName || (`${collectionName}DefaultFragment` as FragmentName);
    return {
      fragment: getFragment(_fragmentName),
      fragmentName: _fragmentName
    };
  }
};
