import React from 'react'
import {Components, registerComponent} from '../../lib/vulcan-lib'
import {taggingNameSetting} from '@/lib/instanceSettings.ts'

const styles = (theme: ThemeType): JssStyles => ({
  root: {},
})

const PostPingbackList = ({postId, tagId, limit, classes}: {
  postId?: string,
  tagId?: string,
  limit: number,
  classes: ClassesType<JssStylesCallback<string>, string>
}) => {

  const {PostsList2, SectionTitle} = Components

  const suffix = postId ? 'one' : taggingNameSetting.get()
  return <PostsList2
    header={<SectionTitle title={'Posts mentioning this ' + suffix}/>}
    terms={{
      view: 'pingbackPosts',
      filter: {
        postId,
        tagId,
      },
    }}
    itemsPerPage={limit}
    showNoResults={false}
  />
}

const PostPingbackListComponent = registerComponent('PostPingbackList', PostPingbackList, {styles})

declare global {
  interface ComponentTypes {
    PostPingbackList: typeof PostPingbackListComponent
  }
}
