import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import React from 'react';
import { Comments } from '../../lib/collections/comments';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import { useCurrentUser } from '../common/withUser'
import { useDialog } from '../common/withDialog';

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
      background: "rgba(0,0,0, 0.05)",
    },
    color: theme.palette.secondary.main,
    float: "right"
  },
})

const NewAnswerForm = ({post, classes}: {
  post: PostsBase,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const SubmitComponent = ({submitLabel = "Submit"}) => {
    const { openDialog } = useDialog();
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
    af: Comments.defaultToAlignment(currentUser, post),
  }
  const { SmartForm } = Components
  
  if (currentUser && !Comments.options.mutations.new.check(currentUser, prefilledProps)) {
    return <span>Sorry, you do not have permission to comment at this time.</span>
  }
  
  return (
    <div className={classes.answersForm}>
      <SmartForm
        collection={Comments}
        formComponents={{
          FormSubmit: SubmitComponent,
          FormGroupLayout: Components.DefaultStyleFormGroup
        }}
        mutationFragment={getFragment('CommentsList')}
        prefilledProps={prefilledProps}
        alignmentForumPost={post.af}
        layout="elementOnly"
        addFields={currentUser?[]:["contents"]}
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

