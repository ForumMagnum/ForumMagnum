import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import { useCurrentUser } from "../../common/withUser";
import { isLW } from "../../../lib/instanceSettings";
import { isFriendlyUI } from '../../../themes/forumTheme';
import { useCreate } from '../../../lib/crud/withCreate';
import { EditorContext } from '../PostsEditForm';
import { useNavigate } from '../../../lib/routeUtil';
import Row from "@/components/common/Row";

export const styles = (theme: ThemeType) => ({
  formButton: {
    fontFamily: theme.typography.commentStyle.fontFamily,
    fontSize: isFriendlyUI ? 14 : 16,
    marginLeft: 5,
    ...(isFriendlyUI ? {
      textTransform: 'none',
    } : {
      paddingBottom: 4,
      fontWeight: 500,
      "&:hover": {
        background: theme.palette.buttons.hoverGrayHighlight,
      }
    })
  },
  secondaryButton: {
    ...(isFriendlyUI ? {
      color: theme.palette.grey[680],
      padding: '8px 12px'
    } : {
      color: theme.palette.text.dim40,
    })
  },
  submitButton: {
    ...(isFriendlyUI ? {
      backgroundColor: theme.palette.buttons.alwaysPrimary,
      color: theme.palette.text.alwaysWhite,
      boxShadow: 'none',
      marginLeft: 10,
    } : {
      color: theme.palette.secondary.main
    })
  },
});

export type DialogueSubmitProps = FormButtonProps & {
  saveDraftLabel?: string,
  feedbackLabel?: string,
  document: PostsPage,
  classes: ClassesType<typeof styles>,
}

const DialogueSubmit = ({
  updateCurrentValues,
  submitForm,
  submitLabel = "Submit",
  saveDraftLabel = "Save as draft",
  document,
  collectionName,
  classes,
}: DialogueSubmitProps) => {
  const currentUser = useCurrentUser();
  if (!currentUser) throw Error("must be logged in to post")

  const { create: createShortform, loading, error } = useCreate({
    collectionName: "Comments",
    fragmentName: 'CommentEdit',
  })
  const userShortformId = currentUser?.shortformFeedId;
  const [editor, _] = React.useContext(EditorContext)

  const navigate = useNavigate();

  const submitWithConfirmation = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm('Warning!  This will publish your dialogue and make it visible to other users.')) {
      collectionName === "Posts" && await updateCurrentValues({draft: false});
      await submitForm();
    }
  };

  const submitWithoutConfirmation = () => collectionName === "Posts" && updateCurrentValues({draft: false});

  const requireConfirmation = isLW && collectionName === 'Posts' && !!document.debate;
  const showShortformButton = !!userShortformId && !isFriendlyUI;

  const onSubmitClick = requireConfirmation ? submitWithConfirmation : submitWithoutConfirmation;
  return (
    <Row justifyContent="flex-end">
      <Button type="submit"
        className={classNames(classes.formButton, classes.secondaryButton)}
        onClick={() => updateCurrentValues({draft: true})}
      >
        {saveDraftLabel}
      </Button>
      {showShortformButton && <Button
        className={classNames(classes.formButton)}
        disabled={loading || !!error}
        onClick={async e => {
          e.preventDefault()

          // So getData() does exist on the Editor. But the typings don't agree. For now, #AnyBecauseHard
          // @ts-ignore
          const shortformString = editor && editor.getData()
          // Casting because the current type we have for new comment creation doesn't quite line up with our actual GraphQL API
          const shortformContents = {originalContents: {type: "ckEditorMarkup", data: shortformString}} as DbComment['contents']

          const response = await createShortform({
            data: {
              contents: shortformContents,
              shortform: true,
              postId: userShortformId,
              originalDialogueId: document._id,
            }
          })

          response.data && navigate(`/posts/${userShortformId}?commentId=${response.data.createComment.data._id}`)
        }}
      >{loading ? "Publishing to shortform ..." : `Publish to ${currentUser?.displayName}'s shortform`}</Button>
      }
      <Button
        type="submit"
        onClick={onSubmitClick}
        className={classNames("primary-form-submit-button", classes.formButton, classes.submitButton)}
        {...(isFriendlyUI ? {
          variant: "contained",
          color: "primary",
        } : {})}
      >
        {submitLabel}
      </Button>
    </Row>
  );
}

const DialogueSubmitComponent = registerComponent('DialogueSubmit', DialogueSubmit, {styles});

declare global {
  interface ComponentTypes {
    DialogueSubmit: typeof DialogueSubmitComponent
  }
}

export default DialogueSubmitComponent;
