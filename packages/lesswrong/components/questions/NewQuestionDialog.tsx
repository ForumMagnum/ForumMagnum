import React from 'react';
import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { useMessages } from '../common/withMessages';

import DialogContent from '@material-ui/core/DialogContent';

import { Posts } from '../../lib/collections/posts/collection'
import { postGetPageUrl } from '../../lib/collections/posts/helpers'
import { useCurrentUser } from '../common/withUser';
import { useNavigation } from '../../lib/routeUtil';
import withMobileDialog from '@material-ui/core/withMobileDialog';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { userNeedsAFNonMemberWarning } from "../../lib/alignment-forum/users/helpers";
import { postSuggestForAlignment } from "../../lib/alignment-forum/posts/helpers";
import { useDialog } from "../common/withDialog";
import { useUpdate } from "../../lib/crud/withUpdate";

const styles = (theme: ThemeType): JssStyles => ({
  formSubmit: {
    display: "flex",
    flexWrap: "wrap",
  }
})

const NewQuestionDialog = ({ onClose, fullScreen, classes }: {
  onClose: any,
  fullScreen: boolean,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  const { history } = useNavigation();
  const { openDialog } = useDialog();
  const { PostSubmit, SubmitToFrontpageCheckbox, LWDialog } = Components
  
  const {mutate: updatePost} = useUpdate({
    collectionName: "Posts",
    fragmentName: 'PostsList',
  });
  
  const QuestionSubmit = (props) => {
    return <div className={classes.formSubmit}>
      <SubmitToFrontpageCheckbox {...props}/>
      <PostSubmit {...props} />
    </div>
  }
  const af = forumTypeSetting.get() === 'AlignmentForum'

  return (
    <LWDialog
      open={true}
      maxWidth={false}
      onClose={onClose}
      fullScreen={fullScreen}
    >
      <DialogContent>
        <Components.WrappedSmartForm
          collection={Posts}
          fields={['title', 'contents', 'question', 'draft', 'submitToFrontpage', ...(af ? ['af'] : [])]}
          mutationFragment={getFragment('PostsList')}
          prefilledProps={{
            userId: currentUser!._id,
            question: true,
            af
          }}
          cancelCallback={onClose}
          successCallback={(post: PostsList) => {
            // if (currentUser && userNeedsAFNonMemberWarning(currentUser, false)) {
            //   console.log("Firing non-member process")
            //   postSuggestForAlignment({currentUser, post, updatePost})
            //   // openDialog({
            //   //   componentName: "AFNonMemberSuccessPopup",
            //   //   componentProps: {_id: post._id}
            //   // })
            // }
            console.log("Finishined non-member process")
            history.push({pathname: postGetPageUrl(post)});
            flash({ messageString: "Post created.", type: 'success'});
            onClose()
          }}
          formComponents={{
            FormSubmit: QuestionSubmit,
          }}
        />
      </DialogContent>
    </LWDialog>
  )
}

const NewQuestionDialogComponent = registerComponent('NewQuestionDialog', NewQuestionDialog, {
  styles,
  hocs: [withMobileDialog()]
});

declare global {
  interface ComponentTypes {
    NewQuestionDialog: typeof NewQuestionDialogComponent
  }
}

