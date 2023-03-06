import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useUpdate } from '../../lib/crud/withUpdate';
import React from 'react';
import { userCanDo, userIsMemberOf } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import * as _ from 'underscore';
import { forumTypeSetting } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  sideMessage: {
    position: "absolute",
    right: 12,
    top: 12,
    color: theme.palette.text.dim40,
    
    [theme.breakpoints.down('xs')]: {
      display: "none",
    }
  },
});

const SuggestCurated = ({post, classes}: {
  post: PostsBase,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { MenuItem } = Components;
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

  if (!userCanDo(currentUser, "posts.moderate.all")
    && !userIsMemberOf(currentUser, 'canSuggestCuration')) {
    return null;
  }
  if (forumTypeSetting.get() === 'AlignmentForum') {
    return null;
  }
  
  if (!(post?.frontpageDate)) {
    return <div className="posts-page-suggest-curated">
      <div>
        <MenuItem disabled>
          Suggest Curation
          <div className={classes.sideMessage}>
            Must be frontpage
          </div>
        </MenuItem>
      </div>
    </div>
  }

  if (!post.curatedDate && !post.reviewForCuratedUserId)
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

const SuggestCuratedComponent = registerComponent('SuggestCurated', SuggestCurated, {styles});

declare global {
  interface ComponentTypes {
    SuggestCurated: typeof SuggestCuratedComponent
  }
}
