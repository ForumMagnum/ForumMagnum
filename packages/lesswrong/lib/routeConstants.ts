import { isFriendlyUI } from '../themes/forumTheme'
import { taggingNamePluralSetting, isEAForum } from './instanceSettings';
import { pluralize } from './vulcan-lib/pluralize';

const knownTagNames = ['tag', 'topic', 'concept', 'wikitag']
const useShortAllTagsPath = isFriendlyUI;

/**
 * Get the path for the all tags page
 */
export const getAllTagsPath = () => {
  return useShortAllTagsPath ? `/${taggingNamePluralSetting.get()}` : `/${taggingNamePluralSetting.get()}/all`;
}

/**
 * Get all the paths that should redirect to the all tags page. This is all combinations of
 * known tag names (e.g. 'topics', 'concepts') with and without `/all` at the end.
 */
export const getAllTagsRedirectPaths: () => string[] = () => {
  const pathRoots = knownTagNames.map(tagName => `/${pluralize(tagName)}`)
  const allPossiblePaths = pathRoots.map(root => [root, `${root}/all`])
  const redirectPaths = ['/wiki', ...allPossiblePaths.flat().filter(path => path !== getAllTagsPath())]
  return redirectPaths
}

export const communityPath = isEAForum ? '/groups' : '/community';
