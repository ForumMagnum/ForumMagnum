import { registerComponent } from '../../lib/vulcan-lib';
import { withUpdate } from '../../lib/crud/withUpdate';
import React, { Component } from 'react';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import withUser from '../common/withUser';
import MenuItem from '@material-ui/core/MenuItem';
import * as _ from 'underscore';
import { forumTypeSetting } from '../../lib/instanceSettings';

interface ExternalProps {
  post: PostsBase,
}
interface SuggestCuratedProps extends ExternalProps, WithUserProps, WithUpdatePostProps {
}

class SuggestCurated extends Component<SuggestCuratedProps> {
  handleSuggestCurated = () => {
    const { currentUser, post, updatePost } = this.props
    if (!currentUser) return;
    let suggestUserIds = _.clone(post.suggestForCuratedUserIds) || []
    if (!suggestUserIds.includes(currentUser._id)) {
      suggestUserIds.push(currentUser._id)
    }
    void updatePost({
      selector: { _id: post._id },
      data: {suggestForCuratedUserIds:suggestUserIds}
    })
  }

  handleUnsuggestCurated = () => {
    const { currentUser, post, updatePost } = this.props
    if (!currentUser) return;
    let suggestUserIds = _.clone(post.suggestForCuratedUserIds) || []
    if (suggestUserIds.includes(currentUser._id)) {
      suggestUserIds = _.without(suggestUserIds, currentUser._id);
    }
    void updatePost({
      selector: { _id: post._id },
      data: {suggestForCuratedUserIds:suggestUserIds}
    })
  }

  render() {
    const { currentUser, post } = this.props;
    if (!currentUser) return null;
    
    if (post?.frontpageDate &&
        !post.curatedDate &&
        !post.reviewForCuratedUserId &&
        forumTypeSetting.get() !== 'AlignmentForum' &&
        userCanDo(this.props.currentUser, "posts.moderate.all"))
    {
      return <div className="posts-page-suggest-curated">
        { !post.suggestForCuratedUserIds || !post.suggestForCuratedUserIds.includes(currentUser._id) ?
          <div onClick={this.handleSuggestCurated}>
            <MenuItem>
              Suggest Curation
            </MenuItem>
          </div> :
          <div onClick={this.handleUnsuggestCurated}>
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
}

const SuggestCuratedComponent = registerComponent<ExternalProps>(
  'SuggestCurated', SuggestCurated, {
    hocs: [
      withUpdate({
        collectionName: "Posts",
        fragmentName: 'PostsList',
      }),
      withUser
    ]
  }
);

declare global {
  interface ComponentTypes {
    SuggestCurated: typeof SuggestCuratedComponent
  }
}
