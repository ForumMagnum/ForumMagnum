import React from 'react';
import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { useMessages } from '../common/withMessages';

import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';

import { Posts } from '../../lib/collections/posts/collection'
import { useCurrentUser } from '../common/withUser';
import { useNavigation } from '../../lib/routeUtil';
import withMobileDialog from '@material-ui/core/withMobileDialog';
import { forumTypeSetting } from '../../lib/instanceSettings';

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
  const { PostSubmit, SubmitToFrontpageCheckbox } = Components
  
  const QuestionSubmit = (props) => {
    return <div className={classes.formSubmit}>
      <SubmitToFrontpageCheckbox {...props}/>
      <PostSubmit {...props} />
    </div>
  }
  const af = forumTypeSetting.get() === 'AlignmentForum'

  return (
    <Dialog
      open={true}
      maxWidth={false}
      onClose={onClose}
      fullScreen={fullScreen}
      disableEnforceFocus
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
            history.push({pathname: Posts.getPageUrl(post)});
            flash({ messageString: "Post created.", type: 'success'});
            onClose()
          }}
          formComponents={{
            FormSubmit: QuestionSubmit,
          }}
        />
      </DialogContent>
    </Dialog>
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

