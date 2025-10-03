import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { getTagPostsSortOrderOptions } from "@/lib/collections/tags/helpers";
import ForumDropdown from "../common/ForumDropdown";

const styles = (theme: ThemeType) => ({
  root: {}
})

const getDefaultOptions = () => Object.keys(getTagPostsSortOrderOptions()) as (keyof ReturnType<typeof getTagPostsSortOrderOptions>)[];

const PostsListSortDropdown = ({value, options=getDefaultOptions(), sortingParam="sortedBy", classes}: {
  value: string
  options?: string[],
  sortingParam?: string,
  classes: ClassesType<typeof styles>,
}) => {
  // if specific options are passed in, filter out any other options from TAG_POSTS_SORT_ORDER_OPTIONS
  const filteredOptions = options
    ? getDefaultOptions()
        .filter((option) => options.includes(option))
        .reduce((obj, key) => {
          return Object.assign(obj, { [key]: getTagPostsSortOrderOptions()[key] });
        }, {})
    : getTagPostsSortOrderOptions();

  return <ForumDropdown value={value} options={filteredOptions} queryParam={sortingParam} />;
}

export default registerComponent('PostsListSortDropdown', PostsListSortDropdown, {styles});


