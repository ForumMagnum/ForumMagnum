import { registerComponent } from 'meteor/vulcan:core';
import { withUpdate } from '../../lib/crud/withUpdate';
import React from 'react';
import { Posts } from '../../lib/collections/posts';
import Users from 'meteor/vulcan:users';
import withUser from '../common/withUser';
import MenuItem from '@material-ui/core/MenuItem';

interface ExternalProps {
  post: any,
}
interface SuggestAlignmentProps extends ExternalProps, WithUserProps {
  updatePost: any,
}
const SuggestAlignment = ({ currentUser, post, updatePost }: SuggestAlignmentProps) => {
  const userHasSuggested = post.suggestForAlignmentUserIds && post.suggestForAlignmentUserIds.includes(currentUser!._id)

  if (Users.canSuggestPostForAlignment({currentUser, post})) {
    return <div>
      { userHasSuggested ?
        <div  onClick={() => Posts.unSuggestForAlignment({currentUser, post, updatePost})}>
          <MenuItem>
            Ω Unsuggest for Alignment
          </MenuItem>
        </div>
        :
        <div  onClick={() => Posts.suggestForAlignment({currentUser, post, updatePost})}>
          <MenuItem>
            Ω Suggest for Alignment
          </MenuItem>
        </div>
      }
    </div>
  } else {
    return null
  }
}

const SuggestAlignmentComponent = registerComponent<ExternalProps>(
  'SuggestAlignment', SuggestAlignment, {
    hocs: [
      withUpdate({
        collection: Posts,
        fragmentName: 'PostsList',
      }),
      withUser
    ]
  }
);

declare global {
  interface ComponentTypes {
    SuggestAlignment: typeof SuggestAlignmentComponent
  }
}
