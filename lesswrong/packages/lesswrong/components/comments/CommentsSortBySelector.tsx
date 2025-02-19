import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { useLocation } from '@/lib/routeUtil';
import qs from 'qs'
import isEmpty from 'lodash/isEmpty';
import type { Option } from '../common/InlineSelect';
import { useNavigate } from '@/lib/reactRouterWrapper';


export const CommentsSortBySelector = ({setRestoreScrollPos}: {
  setRestoreScrollPos?: (pos: number) => void
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { query } = location;
  
  const {InlineSelect} = Components

  const sortByOptions = [
    {value: "top", label: "Top"},
    {value: "magic", label: "Magic (New & Upvoted)"},
    {value: "new", label: "Newest"},
    {value: "old", label: "Oldest"},
    {value: "recentComments", label: "Recent Replies"}
  ]

  const handleViewClick = (opt: Option & {value: CommentsViewName}) => {
    const sortBy = opt.value
    const { query } = location;
    const currentQuery = isEmpty(query) ? {} : query
    const newQuery = {...currentQuery, commentsSortBy: sortBy}
    setRestoreScrollPos?.(window.scrollY);
    navigate({...location.location, search: `?${qs.stringify(newQuery)}`})
  };

  const currentSortBy: string = query?.commentsSortBy || "new"
  const selectedOption = sortByOptions.find((option) => option.value === currentSortBy) || sortByOptions[0]

  return <InlineSelect options={sortByOptions} selected={selectedOption} handleSelect={handleViewClick}/>
};

const CommentsSortBySelectorComponent = registerComponent('CommentsSortBySelector', CommentsSortBySelector);

declare global {
  interface ComponentTypes {
    CommentsSortBySelector: typeof CommentsSortBySelectorComponent
  }
}
