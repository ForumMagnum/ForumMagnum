import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import Checkbox from '@material-ui/core/Checkbox';
import { useMulti } from '../../lib/crud/withMulti';
import { useUpdate } from '../../lib/crud/withUpdate';
import { useCreate } from '../../lib/crud/withCreate';
import { useCurrentUser } from '../common/withUser';

/**
 * This is used by the EA Forum Wrapped page, to let users indicate which posts they found particularly valuable.
 */
export const PostMostValuableCheckbox = ({post}: {
  post: PostsBase,
}) => {
  const currentUser = useCurrentUser()
  const { results, loading } = useMulti({
    terms: {view: "currentUserPost", postId: post._id},
    collectionName: "UserMostValuablePosts",
    fragmentName: "UserMostValuablePostInfo",
    limit: 1,
  })
  
  const { create: createMostValuable } = useCreate({
    collectionName: 'UserMostValuablePosts',
    fragmentName: 'UserMostValuablePostInfo',
  })
  const { mutate: setMostValuable } = useUpdate({
    collectionName: "UserMostValuablePosts",
    fragmentName: 'UserMostValuablePostInfo',
  })
  
  const toggleChecked = () => {
    if (loading || !currentUser) return
    
    if (results && results.length) {
      void setMostValuable({
        selector: {
          _id: results[0]._id
        },
        data: {
          deleted: !results[0].deleted
        }
      })
    } else {
      void createMostValuable({
        data: {
          userId: currentUser._id,
          postId: post._id
        }
      })
    }
  }
  
  if (!currentUser || loading || !results) return null
  
  return <Checkbox checked={!!results.length && !results[0].deleted} onClick={toggleChecked} />
}

const PostMostValuableCheckboxComponent = registerComponent('PostMostValuableCheckbox', PostMostValuableCheckbox);

declare global {
  interface ComponentTypes {
    PostMostValuableCheckbox: typeof PostMostValuableCheckboxComponent
  }
}

