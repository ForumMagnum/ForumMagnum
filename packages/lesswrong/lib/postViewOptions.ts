/** TODO: Use this in more places, like AnswersSorting */
import { isFriendlyUI } from "../themes/forumTheme";
import { sortMagicNameSetting, sortTopPostNameSetting, sortNewNameSetting, sortOldNameSetting, sortRecentCommentsNameSetting } from "./instanceSettings";

const customViewNames: Partial<Record<PostsViewName,string>> = {
  'magic': sortMagicNameSetting.get() ?? (isFriendlyUI ? 'New & upvoted' : 'magic (new & upvoted)'),
  'topThisWeek': 'Top This Week',
  'top': sortTopPostNameSetting.get() ?? (isFriendlyUI ? 'Top' : 'top scoring'),
  'recentComments': sortRecentCommentsNameSetting.get() ?? (isFriendlyUI ? 'Latest comment' : 'latest comment'),
  'new': sortNewNameSetting.get() ?? (isFriendlyUI ? 'New' : 'newest'),
  'old': sortOldNameSetting.get() ?? (isFriendlyUI ? 'Old' : 'oldest')
}

const defaultViews: PostsViewName[] = [
  "magic",
  "top",
  "topThisWeek",
  "new",
  "old",
  "recentComments",
];

const getPostViewNames = (): PostsViewName[] => [
  ...defaultViews
];

export const getPostViewOptions = (): {value: PostsViewName, label: string}[] =>
  getPostViewNames().map((view) => ({
    value: view,
    label: customViewNames[view] ?? view,
  }));
