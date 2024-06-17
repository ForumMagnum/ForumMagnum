/** Helpers to get values depending on name
 * E.g. retrieving a collection and its name when only one value is provided
 *
 */
import { getFragment, getFragmentName } from './fragments';

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
    if (!fragmentName) {
      // eslint-disable-next-line no-console
      console.error(`Used DefaultFragment fallback on ${collectionName}`);
    }
    const _fragmentName = fragmentName || (`${collectionName}DefaultFragment` as FragmentName);
    return {
      fragment: getFragment(_fragmentName),
      fragmentName: _fragmentName
    };
  }
};
