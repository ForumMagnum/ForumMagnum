import React from 'react'
import {Components, registerComponent} from '../../lib/vulcan-lib'
import {taggingNameSetting} from '@/lib/instanceSettings.ts'

const styles = (theme: ThemeType): JssStyles => ({
  root: {},
  commentList: {
    '& .ShortformListItem-root': {
      paddingLeft: '9px',
    },
  },
})

const UnifiedPingbackList = ({classes, postId, tagId, limit = 5}: {
  postId?: string,
  tagId?: string,
  limit?: number
  classes: ClassesType,
}) => {
  // todo compact and expand view
  // todo hide each section if no pingbacks and hide whole thing if no pingbacks

  const {
    PostPingbackList,
    TagPingbackList,
  } = Components

  return <div className={'sections'}>
    <TagPingbackList postId={postId} tagId={tagId} limit={limit}/>
    <PostPingbackList postId={postId} tagId={tagId} limit={limit}/>
    <CommentPingbackList postId={postId} tagId={tagId} limit={limit} classes={classes}/>
  </div>

}

const CommentPingbackList = ({postId, tagId, limit, classes}: {
  postId?: string,
  tagId?: string,
  limit?: number,
  classes: ClassesType,
}) => {
  const {CommentsListCondensed} = Components

  const suffix = postId ? 'post' : taggingNameSetting.get()
  return <div className={classes.commentList}>
    <CommentsListCondensed
      label={'Comments mentioning this ' + suffix}
      terms={{
        view: 'pingbackComments' as const,
        filter: {
          postId,
          tagId,
        },
      }}
      initialLimit={limit}
      itemsPerPage={20}
      showTotal
    />
  </div>
}

const UnifiedPingbackListComponent = registerComponent('UnifiedPingbackList', UnifiedPingbackList, {styles})

declare global {
  interface ComponentTypes {
    UnifiedPingbackList: typeof UnifiedPingbackListComponent
  }
}
