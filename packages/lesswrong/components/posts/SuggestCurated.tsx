import { registerComponent } from '../../lib/vulcan-lib';
import { useUpdate } from '../../lib/crud/withUpdate';
import React from 'react';
import { userCanDo, userIsMemberOf } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import MenuItem from '@material-ui/core/MenuItem';
import * as _ from 'underscore';
import { forumTypeSetting } from '../../lib/instanceSettings';

const SuggestCurated = ({post}: {
  post: PostsBase,
}) => {
  const currentUser = useCurrentUser();
  const {mutate: updatePost} = useUpdate({
    collectionName: "Posts",
    fragmentName: 'PostsList',
  });
  
  if (!currentUser)
    return null;
  
  const handleSuggestCurated = () => {
    let suggestUserIds = _.clone(post.suggestForCuratedUserIds) || []
    if (!suggestUserIds.includes(currentUser._id)) {
      suggestUserIds.push(currentUser._id)
    }
    void updatePost({
      selector: { _id: post._id },
      data: {suggestForCuratedUserIds:suggestUserIds}
    })
  }

  const handleUnsuggestCurated = () => {
    let suggestUserIds = _.clone(post.suggestForCuratedUserIds) || []
    if (suggestUserIds.includes(currentUser._id)) {
      suggestUserIds = _.without(suggestUserIds, currentUser._id);
    }
    void updatePost({
      selector: { _id: post._id },
      data: {suggestForCuratedUserIds:suggestUserIds}
    })
  }

  if (post?.frontpageDate &&
      !post.curatedDate &&
      !post.reviewForCuratedUserId &&
      forumTypeSetting.get() !== 'AlignmentForum' &&
      (userCanDo(currentUser, "posts.moderate.all") || 
      userIsMemberOf(currentUser, 'canSuggestCuration')))
  {
    return <div className="posts-page-suggest-curated">
      { !post.suggestForCuratedUserIds || !post.suggestForCuratedUserIds.includes(currentUser._id) ?
        <div onClick={handleSuggestCurated}>
          <MenuItem>
            Suggest Curation
          </MenuItem>
        </div> :
        <div onClick={handleUnsuggestCurated}>
          <MenuItem>
            Unsuggest Curation
          </MenuItem>
        </div>
      }
    </div>
  } else {
    return null
  }
}

const SuggestCuratedComponent = registerComponent('SuggestCurated', SuggestCurated);

declare global {
  interface ComponentTypes {
    SuggestCurated: typeof SuggestCuratedComponent
  }
}
