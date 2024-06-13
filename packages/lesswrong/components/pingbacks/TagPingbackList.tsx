import React from 'react'
import {Components, registerComponent} from '../../lib/vulcan-lib'
import {useMulti} from '../../lib/crud/withMulti'
import {taggingNamePluralCapitalSetting} from '@/lib/instanceSettings.ts'
import {Link} from '@/lib/reactRouterWrapper.tsx'
import {tagGetUrl} from '@/lib/collections/tags/helpers.ts'
import LibraryBooksIcon from '@material-ui/icons/LibraryBooksOutlined'


const styles = (theme: ThemeType): JssStyles => ({
  root: {},
  loadMore: {
    ...theme.typography.commentStyle,
    display: 'inline-block',
    lineHeight: '1rem',
    marginBottom: -4,
    fontWeight: 600,
    marginTop: 12,
    color: theme.palette.primary.main,
    '&:hover': {
      color: theme.palette.primary.dark,
      opacity: 1,
    },
  },
  list: {
    marginTop: '0.5em',
    columns: 2,
    columnGap: 0,
  },
  parentTagName: {
    color: theme.palette.grey[600],
  },
  tagPingback: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    paddingLeft: '1em',
    marginBottom: '0.5em',
    display: 'flex',
    breakInside: 'avoid-column',
  },
  tagListIcon: {
    color: theme.palette.grey[600],
    marginRight: '0.3em',
  },
})


function TagPingback({tag, classes}: {
  tag: TagFragment,
  classes: ClassesType,
}) {
  const {
    TagsTooltip,
  } = Components

  return <TagsTooltip tag={tag} className={classes.tagPingback}>
    <LibraryBooksIcon className={classes.tagListIcon}/>
    <Link to={tagGetUrl(tag)}>
      <span className={classes.parentTagName}>{tag.parentTag && tag.parentTag.name + '/'}</span>{tag.name}
    </Link>
  </TagsTooltip>
}

const TagPingbackList = ({postId, tagId, limit = 10, classes}: {
  postId?: string,
  tagId?: string,
  limit?: number,
  classes: ClassesType
}) => {
  const {results, loadMoreProps, loading} = useMulti({
    terms: {
      view: 'pingbackTags',
      filter: {
        postId,
        tagId,
      },
    },
    collectionName: 'Tags',
    fragmentName: 'TagFragment',
    limit: limit,
    enableTotal: true,
  })

  const {
    LoadMore,
    Loading,
    SectionTitle,
  } = Components

  if (!results?.length) return null

  const suffix = tagId ? 'one' : 'post'

  return <div className={classes.root}>
    <SectionTitle title={`${taggingNamePluralCapitalSetting.get()} mentioning this ${suffix}`}/>
    <div className={classes.list}>
      {results.map((tag) =>
        <TagPingback tag={tag} key={tag._id} classes={classes}/>)}
    </div>
    {loading ? <Loading/> : <LoadMore className={classes.loadMore} {...loadMoreProps}/>}
  </div>
}

const TagPingbackListComponent = registerComponent('TagPingbackList', TagPingbackList, {styles})

declare global {
  interface ComponentTypes {
    TagPingbackList: typeof TagPingbackListComponent
  }
}
