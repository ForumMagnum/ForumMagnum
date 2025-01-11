import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import qs from 'qs'
import * as _ from 'underscore';
import type { Option } from '../common/InlineSelect';
import { useNavigate } from '../../lib/reactRouterWrapper';
import { isFriendlyUI, preferredHeadingCase } from '../../themes/forumTheme';

const sortingNames = {
  'top': isFriendlyUI ? 'Top' : 'top scoring',
  'magic': isFriendlyUI ? 'New & upvoted' : 'magic (new & upvoted)',
  'newest': isFriendlyUI ? 'New' : 'newest',
  'oldest': isFriendlyUI ? 'Old' : 'oldest',
  'recentComments': preferredHeadingCase('latest reply'),
}

const AnswersSorting = ({ post }: {
  post?: PostsList,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { query } = location;
  
  const {InlineSelect} = Components;

  const handleSortingClick = (opt: Option) => {
    const sorting = opt.value;
    const { query } = location;
    const currentQuery = _.isEmpty(query) ? { answersSorting: "top" } : query;
    const newQuery = { ...currentQuery, answersSorting: sorting, postId: post ? post._id : undefined };
    navigate({ ...location.location, search: `?${qs.stringify(newQuery)}` });
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
