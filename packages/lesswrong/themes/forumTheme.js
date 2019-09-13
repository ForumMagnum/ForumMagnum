import { getSetting } from 'meteor/vulcan:core'
import { customThemes } from './customThemes.js';
import deepmerge from 'deepmerge';

let forumTheme
switch (getSetting('forumType')) {
  case 'AlignmentForum':
    import afTheme from '../themes/alignmentForumTheme'
    forumTheme = afTheme
    break
  case 'EAForum':
    import eaTheme from '../themes/eaTheme'
    forumTheme = eaTheme
    break
  default:
    import lwTheme from '../themes/lesswrongTheme'
    forumTheme = lwTheme
}

const getUncustomizedTheme = () => {
  return forumTheme;
}

export const getForumTheme = ({user, cookies}) => {
  const customThemeName = user?.theme || "default";
  const customTheme = customThemes[customThemeName];
  return deepmerge(getUncustomizedTheme(), customTheme);
};

export const getEmailTheme = ({user}) => {
  return getUncustomizedTheme();
}
