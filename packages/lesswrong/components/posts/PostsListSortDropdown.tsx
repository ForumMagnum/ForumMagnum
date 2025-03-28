import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { TAG_POSTS_SORT_ORDER_OPTIONS } from '../../lib/collections/tags/schema';

const styles = (theme: ThemeType) => ({
  root: {}
})

const defaultOptions = Object.keys(TAG_POSTS_SORT_ORDER_OPTIONS);

const PostsListSortDropdown = ({value, options=defaultOptions, sortingParam="sortedBy", classes}: {
  value: string
  options?: string[],
  sortingParam?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const { ForumDropdown } = Components;

  // if specific options are passed in, filter out any other options from TAG_POSTS_SORT_ORDER_OPTIONS
  const filteredOptions = options
    ? defaultOptions
        .filter((option) => options.includes(option))
        .reduce((obj, key) => {
          return Object.assign(obj, { [key]: TAG_POSTS_SORT_ORDER_OPTIONS[key] });
        }, {})
    : TAG_POSTS_SORT_ORDER_OPTIONS;

  return <ForumDropdown value={value} options={filteredOptions} queryParam={sortingParam} />;
}

const PostsListSortDropdownComponent = registerComponent('PostsListSortDropdown', PostsListSortDropdown, {styles});

declare global {
  interface ComponentTypes {
    PostsListSortDropdown: typeof PostsListSortDropdownComponent
  }
}
