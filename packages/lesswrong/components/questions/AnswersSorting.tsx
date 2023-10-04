import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import qs from 'qs'
import * as _ from 'underscore';
import type { Option } from '../common/InlineSelect';
import { isFriendlyUI } from '../../themes/forumTheme';

// TODO: use postViewOptions
export const sortingNames = {
  'top': 'top scoring',
  'magic': isFriendlyUI ? 'new & upvoted' : 'magic (new & upvoted)',
  'newest': 'newest',
  'oldest': 'oldest',
  'recentComments': 'latest reply',
}

const AnswersSorting = ({ post, classes }: {
  post?: PostsList,
  classes: ClassesType,
}) => {
  const { history } = useNavigation();
  const location = useLocation();
  const { query } = location;
  
  const {InlineSelect} = Components;

  const handleSortingClick = (opt: Option) => {
    const sorting = opt.value;
    const { query } = location;
    const currentQuery = _.isEmpty(query) ? { answersSorting: "top" } : query;
    const newQuery = { ...currentQuery, answersSorting: sorting, postId: post ? post._id : undefined };
    history.push({ ...location.location, search: `?${qs.stringify(newQuery)}` });
  };

  const sortings = [...Object.keys(sortingNames)] as (keyof typeof sortingNames)[];
  const currentSorting = query?.answersSorting || "top";
  
  const viewOptions: Array<Option> = sortings.map((view) => {
    return {value: view, label: sortingNames[view] || view}
  })
  const selectedOption = viewOptions.find((option) => option.value === currentSorting) || viewOptions[0]

  return <InlineSelect options={viewOptions} selected={selectedOption} handleSelect={handleSortingClick}/>
};

const AnswersSortingComponent = registerComponent('AnswersSorting', AnswersSorting);

declare global {
  interface ComponentTypes {
    AnswersSorting: typeof AnswersSortingComponent,
  }
}
