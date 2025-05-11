import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import qs from 'qs'
import isEmpty from 'lodash/isEmpty';
import InlineSelect, { Option } from '../common/InlineSelect';
import { useLocation, useNavigate } from "@/lib/routeUtil";

export const CommentsSortBySelector = ({setRestoreScrollPos}: {
  setRestoreScrollPos?: (pos: number) => void
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { query } = location;
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

export default registerComponent('CommentsSortBySelector', CommentsSortBySelector);


