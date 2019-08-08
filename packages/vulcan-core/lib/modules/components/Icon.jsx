import { registerComponent, Utils } from 'meteor/vulcan:lib';
import React from 'react';

/**
 * @summary A directory of icon keys and icon codes
 */
const icons = {
  expand: 'angle-right',
  collapse: 'angle-down',
  next: 'angle-right',
  close: 'times',
  upvote: 'chevron-up',
  voted: 'check',
  downvote: 'chevron-down',
  facebook: 'facebook-square',
  twitter: 'twitter',
  googleplus: 'google-plus',
  linkedin: 'linkedin-square',
  comment: 'comment-o',
  share: 'share-square-o',
  more: 'ellipsis-h',
  menu: 'bars',
  subscribe: 'envelope-o',
  delete: 'trash-o',
  edit: 'pencil',
  popularity: 'fire',
  time: 'clock-o',
  best: 'star',
  search: 'search',
  approve: 'check-circle-o',
  reject: 'times-circle-o',
  views: 'eye',
  clicks: 'mouse-pointer', 
  score: 'line-chart',
  reply: 'reply',
  spinner: 'spinner',
  new: 'plus',
  user: 'user',
  like: 'heart',
  image: 'picture-o',
};

const Icon = ({ name, iconClass, onClick }) => {
  const iconCode = !!icons[name] ? icons[name] : name;
  iconClass = (typeof iconClass === 'string') ? ' '+iconClass : '';
  const c = 'icon fa fa-fw fa-' + iconCode + ' icon-' + name + iconClass;
  return <i onClick={onClick} className={c} aria-hidden="true"></i>;
};

Icon.displayName = 'Icon';

registerComponent('Icon', Icon);

export default Icon;