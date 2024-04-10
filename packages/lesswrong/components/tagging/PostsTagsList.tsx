import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
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

type TagWithCount = TagPreviewFragment & {count: number}

// This is designed to be used with list of posts, to show a list of all the tags currently
// included among that list of posts, and allow users to filter the post list to only show 
// those tags.
export const PostsTagsList = ({classes, posts, currentFilter, handleFilter, expandedMinCount=3, defaultMax=6}: {
  classes: ClassesType,
  posts: PostsList[]|null,
  currentFilter: string|null, // the current tag being filtered on the post list
  handleFilter: (filter: string) => void, // function to update which tag is being filtered
  expandedMinCount?: number // when showing more tags, this is the number
  // of posts each tag needs to have to be included
  defaultMax?: number // default number of tags to show
}) => {
  const { LWTooltip } = Components


  const allTags = posts?.flatMap(post => post.tags) ?? []
  const uniqueTags = [...new Set(allTags)]
  const tagsWithCount: TagWithCount[] = uniqueTags.map(tag => ({
    ...tag,
    count: allTags.filter(t => t._id === tag._id).length
  }))

  const [max, setMax] = useState<number>(defaultMax)
  const sortedTagsWithCount = sortBy(tagsWithCount, tag => -tag.count)
  const slicedTags = sortedTagsWithCount.slice(0,max)

  const expandedNumberOfTags = filter(tagsWithCount, tag => tag.count >= expandedMinCount).length

  const tagButtonTooltip = (tag: TagWithCount) => {
    if (currentFilter === tag._id) return `Show posts of all tags`
    return `Filter posts to only show posts tagged '${tag.name}'`
  }

  const tagButton = (tag: TagWithCount) => <LWTooltip title={tagButtonTooltip(tag)}><div key={tag._id} className={classNames(classes.tagFilter, {[classes.selected]: currentFilter === tag._id})} onClick={()=>handleFilter(tag._id)}>
    {tag.name} <span className={classes.count}>{tag.count}</span>
  </div></LWTooltip>

  if (!posts?.length) return null

  return <div className={classes.root}>
    {slicedTags.map(tag => tagButton(tag))}
    {(max === defaultMax) && <LWTooltip title={`Show ${expandedNumberOfTags - defaultMax} more tags`}><a className={classes.button} onClick={() => setMax(expandedNumberOfTags)}>More</a></LWTooltip>}
    {(max !== defaultMax) && <a  className={classes.button} onClick={() => setMax(defaultMax)}>Fewer</a>}
  </div>;
}

const PostsTagsListComponent = registerComponent('PostsTagsList', PostsTagsList, {styles});

declare global {
  interface ComponentTypes {
    PostsTagsList: typeof PostsTagsListComponent
  }
}

