import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import React from 'react';
import { Comments } from '../../lib/collections/comments';
import { commentDefaultToAlignment } from '../../lib/collections/comments/helpers';
import { userIsAllowedToComment } from '../../lib/collections/users/helpers';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import { useCurrentUser } from '../common/withUser'
import { useDialog } from '../common/withDialog';
import { useUpdateComment } from '../hooks/useUpdateComment';
import { afCommentNonMemberSuccessHandling } from "../../lib/alignment-forum/displayAFNonMemberPopups";
import { isEAForum } from '../../lib/instanceSettings';
import { BtnProps } from '../comments/CommentsNewForm';

const styles = (theme: ThemeType): JssStyles => ({
  answersForm: {
    padding: '0 12px 44px',
    [theme.breakpoints.down('md')]: {
      marginLeft: "auto",
      marginRight: "auto"
    }
  },
  formButton: isEAForum ? {
    float: "right",
    backgroundColor: theme.palette.buttons.alwaysPrimary,
    color: theme.palette.text.alwaysWhite,
    fontSize: 14,
    textTransform: 'none',
    padding: '6px 12px',
    borderRadius: 6,
    boxShadow: 'none',
    marginLeft: 8,
  } : {
    color: theme.palette.secondary.main,
    float: "right",
    paddingBottom: "2px",
    fontSize: "16px",
    marginLeft: "5px",
    "&:hover": {
      background: theme.palette.buttons.hoverGrayHighlight,
    },
  },
})

const NewAnswerForm = ({post, classes}: {
  post: PostsDetails,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const updateComment = useUpdateComment();
  
  const SubmitComponent = ({submitLabel = "Submit"}) => {
    const submitBtnProps: BtnProps = isEAForum ? {variant: 'contained', color: 'primary'} : {}
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
        {...submitBtnProps}
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
  
  if (currentUser && !userIsAllowedToComment(currentUser, post, post.user, false)) {
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
        formProps={{
          editorHintText: isEAForum ? 'Write a new answer...' : undefined
        }}
        successCallback={(comment: CommentsList, { form }: { form: any }) => {
          afCommentNonMemberSuccessHandling({currentUser, comment, openDialog, updateComment})
        }}
        submitLabel={isEAForum ? 'Add answer' : 'Submit'}
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

