import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import groupBy from 'lodash/groupBy';
import { tagStyle } from './FooterTag';
import sortBy from 'lodash/sortBy';
import classNames from 'classnames';
import filter from 'lodash/filter';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 4
  },
  tagFilter: {
    ...tagStyle(theme),
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    marginTop: 2,
    marginBottom: 2,
    // paddingLeft: 10,
    // paddingRight: 8
  },
  count: {
    ...theme.typography.body2,
    fontSize: "1rem",
    marginLeft: 6,
    color: theme.palette.grey[500]
  },
  selected: {
    backgroundColor: theme.palette.grey[700],
    color: theme.palette.background.pageActiveAreaBackground
  },
  button: {
    ...theme.typography.body2,
    color: theme.palette.grey[500],
    fontSize: "1rem",
    marginLeft: 6,
  }
});

export const PostsTagsList = ({classes, posts, currentFilter, handleFilter}:{
  classes: ClassesType,
  posts: PostsList[]|null,
  currentFilter: string|null,
  handleFilter: (string) => void
}) => {
  const { LWTooltip } = Components

  if (!posts?.length) return null

  const tags = posts?.flatMap(post => post.tags)
  const groupedTags = groupBy(tags, (tag) => tag._id)
  const tagsWithCount = Object.entries(groupedTags).map(tag => ({
    ...tag[1][0],
    count: tag[1].length
  }))

  const defaultMax = 6 // default number of tags to show
  const expandedMinCount = 3 // when showing more tags, this is the number
  // of posts each tag needs to have to be included

  const [max, setMax] = useState<number>(defaultMax)
  const sortedTagsWithCount = sortBy(tagsWithCount, tag => -tag.count)
  const slicedTags = sortedTagsWithCount.slice(0,max)

  const tagButtonTooltip = (tag) => {
    if (currentFilter === tag._id) return `Show posts of all tags`
    return `Filter posts to only show posts tagged '${tag.name}'`
  }

  const tagButton = (tag) => <LWTooltip title={tagButtonTooltip(tag)}><div key={tag._id} className={classNames(classes.tagFilter, {[classes.selected]: currentFilter === tag._id})} onClick={()=>handleFilter(tag._id)}>
    {tag.name} <span className={classes.count}>{tag.count}</span>
  </div></LWTooltip>

  return <div className={classes.root}>
    {slicedTags.map(tag => tagButton(tag))}
    {(max === defaultMax) && <a className={classes.button} onClick={() => setMax(filter(tagsWithCount, tag => tag.count >= expandedMinCount).length)}>More</a>}
    {(max !== defaultMax) && <a  className={classes.button} onClick={() => setMax(defaultMax)}>Fewer</a>}
  </div>;
}

const PostsTagsListComponent = registerComponent('PostsTagsList', PostsTagsList, {styles});

declare global {
  interface ComponentTypes {
    PostsTagsList: typeof PostsTagsListComponent
  }
}

