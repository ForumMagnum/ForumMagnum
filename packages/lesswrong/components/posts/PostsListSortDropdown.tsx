import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { getTagPostsSortOrderOptions } from "@/lib/collections/tags/helpers";
import ForumDropdown from "../common/ForumDropdown";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('PostsListSortDropdown', (theme: ThemeType) => ({
  root: {}
}))

const getDefaultOptions = () => Object.keys(getTagPostsSortOrderOptions()) as (keyof ReturnType<typeof getTagPostsSortOrderOptions>)[];

const PostsListSortDropdown = ({value, options=getDefaultOptions(), sortingParam="sortedBy"}: {
  value: string
  options?: string[],
  sortingParam?: string,
}) => {
  const classes = useStyles(styles);

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


