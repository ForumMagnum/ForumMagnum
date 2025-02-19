/** TODO: Use this in more places, like AnswersSorting */
import { isFriendlyUI } from "../themes/forumTheme";

const customViewNames: Partial<Record<PostsViewName,string>> = {
  'magic': isFriendlyUI ? 'New & upvoted' : 'magic (new & upvoted)',
  'top': isFriendlyUI ? 'Top' : 'top scoring',
  'recentComments': isFriendlyUI ? 'Latest comment' : 'latest comment',
  'new': isFriendlyUI ? 'New' : 'newest',
  'old': isFriendlyUI ? 'Old' : 'oldest'
}

const defaultViews: PostsViewName[] = [
  "magic",
  "top",
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
