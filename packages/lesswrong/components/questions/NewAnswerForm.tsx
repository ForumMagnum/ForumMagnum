import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import React from 'react';
import { Comments } from '../../lib/collections/comments';
import { commentDefaultToAlignment } from '../../lib/collections/comments/helpers';
import { userIsAllowedToComment } from '../../lib/collections/users/helpers';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import { useCurrentUser } from '../common/withUser'
import { useDialog } from '../common/withDialog';
import { useUpdate } from "../../lib/crud/withUpdate";
import { afNonMemberSuccessHandling } from "../../lib/alignment-forum/displayAFNonMemberPopups";

const styles = (theme: ThemeType): JssStyles => ({
  answersForm: {
    maxWidth:650,
    paddingBottom: theme.spacing.unit*4,
    [theme.breakpoints.down('md')]: {
      marginLeft: "auto",
      marginRight: "auto"
    }
  },
  formButton: {
    paddingBottom: "2px",
    fontSize: "16px",
    marginLeft: "5px",
    "&:hover": {
      background: theme.palette.buttons.hoverGrayHighlight,
    },
    color: theme.palette.secondary.main,
    float: "right"
  },
})

const NewAnswerForm = ({post, classes}: {
  post: PostsDetails,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const {mutate: updateComment} = useUpdate({
    collectionName: "Comments",
    fragmentName: 'CommentsList',
  });
  
  const SubmitComponent = ({submitLabel = "Submit"}) => {
    return <div className={classes.submit}>
      <Button
        type="submit"
        className={classNames(classes.formButton)}
        onClick={(ev) => {
          if (!currentUser) {
            openDialog({
              componentName: "LoginPopup",
              componentProps: {}
            });
            ev.preventDefault();
          }
        }}
      >
        {submitLabel}
      </Button>
    </div>
  };

  const prefilledProps = {
    postId: post._id,
    answer: true,
    af: commentDefaultToAlignment(currentUser, post),
  }
  const { FormWrapper } = Components
  
  if (currentUser && !userIsAllowedToComment(currentUser, post, post.user)) {
    return <span>Sorry, you do not have permission to comment at this time.</span>
  }
  
  return (
    <div className={classes.answersForm}>
      <FormWrapper
        collectionName="Comments"
        formComponents={{
          FormSubmit: SubmitComponent,
          FormGroupLayout: Components.DefaultStyleFormGroup
        }}
        mutationFragment={getFragment('CommentsList')}
        prefilledProps={prefilledProps}
        alignmentForumPost={post.af}
        layout="elementOnly"
        addFields={currentUser?[]:["contents"]}
        successCallback={(comment: CommentsList, { form }: { form: any }) => {
          afNonMemberSuccessHandling({currentUser, document: comment, openDialog, updateDocument: updateComment})
        }}
      />
    </div>
  )
};

const NewAnswerFormComponent = registerComponent('NewAnswerForm', NewAnswerForm, {styles});

declare global {
  interface ComponentTypes {
    NewAnswerForm: typeof NewAnswerFormComponent
  }
}

