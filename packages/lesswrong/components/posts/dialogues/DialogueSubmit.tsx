import React from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import { useCurrentUser } from "../../common/withUser";
import { useTracking } from "../../../lib/analyticsEvents";
import { isEAForum, isLW } from "../../../lib/instanceSettings";
import { useCreate } from '../../../lib/crud/withCreate';
import { useNavigation } from '../../../lib/routeUtil';
import { EditorContext } from '../PostsEditForm';

export const styles = (theme: ThemeType): JssStyles => ({
  formButton: {
    fontFamily: theme.typography.commentStyle.fontFamily,
    fontSize: isEAForum ? 14 : 16,
    marginLeft: 5,
    ...(isEAForum ? {
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
    ...(isEAForum ? {
      color: theme.palette.grey[680],
      padding: '8px 12px'
    } : {
      color: theme.palette.text.dim40,
    })
  },
  submitButtons: {
    marginLeft: 'auto'
  },
  submitButton: {
    ...(isEAForum ? {
      backgroundColor: theme.palette.buttons.alwaysPrimary,
      color: theme.palette.text.alwaysWhite,
      boxShadow: 'none',
      marginLeft: 10,
    } : {
      color: theme.palette.secondary.main
    })
  },
  cancelButton: {
  },
  draft: {
  },
  feedback: {
  }
});

export type DialogueSubmitProps = FormButtonProps & {
  saveDraftLabel?: string,
  feedbackLabel?: string,
  document: PostsPage,
  classes: ClassesType
}

type CoauthorSignoff = {
  displayName: string,
  signedOff: boolean
}

const DialogueSubmit = ({
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  saveDraftLabel = "Save as draft",
  document, collectionName, classes
}: DialogueSubmitProps, { updateCurrentValues, addToSuccessForm, submitForm }: any) => {
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking();
  if (!currentUser) throw Error("must be logged in to post")

  const { create: createShortform, loading, error } = useCreate({
    collectionName: "Comments",
    fragmentName: 'CommentEdit',
  })
  const userShortformId = currentUser?.shortformFeedId;
  const [editor, _] = React.useContext(EditorContext)

  const { SectionFooterCheckbox, Row } = Components;

  const defaultCoauthorSignoffs = document.coauthors.reduce((result: Record<string, CoauthorSignoff>, coauthor: UsersMinimumInfo) => {
    result[coauthor._id] = {displayName: coauthor.displayName, signedOff: false};
      return result;
  }, {});

  const [coauthorSignoffs, setCoauthorSignoffs] = React.useState<Record<string, CoauthorSignoff>>(defaultCoauthorSignoffs)

  const { history } = useNavigation();

  const submitWithConfirmation = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm('Warning!  This will publish your dialogue and make it visible to other users.')) {
      collectionName === "Posts" && await updateCurrentValues({draft: false});
      await submitForm();
    }
  };

  const submitWithoutConfirmation = () => collectionName === "Posts" && updateCurrentValues({draft: false});

  const requireConfirmation = isLW && collectionName === 'Posts' && !!document.debate;

  const onSubmitClick = requireConfirmation ? submitWithConfirmation : submitWithoutConfirmation;


  return (
    <React.Fragment>
      <Row justifyContent="flex-end">
        <Button type="submit"
          className={classNames(classes.formButton, classes.secondaryButton, classes.draft)}
          onClick={() => updateCurrentValues({draft: true})}
        >
          {saveDraftLabel}
        </Button>
        {userShortformId && <Button
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

            response.data && history.push(`/posts/${userShortformId}?commentId=${response.data.createComment.data._id}`)
          }}
        >{loading ? "Publishing to shortform ..." : `Publish to ${currentUser?.displayName}'s shortform`}</Button>
        }
        <Button
          type="submit"
          onClick={onSubmitClick}
          className={classNames("primary-form-submit-button", classes.formButton, classes.submitButton)}
          {...(isEAForum ? {
            variant: "contained",
            color: "primary",
          } : {})}
        >
          {submitLabel}
        </Button>
      </Row>
    </React.Fragment>
  );
}

DialogueSubmit.propTypes = {
  submitLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  cancelCallback: PropTypes.func,
  document: PropTypes.object,
  collectionName: PropTypes.string,
  classes: PropTypes.object,
};

DialogueSubmit.contextTypes = {
  updateCurrentValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
  addToSubmitForm: PropTypes.func,
  submitForm: PropTypes.func
}


// HACK: Cast DialogueSubmit to hide the legacy context arguments, to make the type checking work
const DialogueSubmitComponent = registerComponent('DialogueSubmit', (DialogueSubmit as React.ComponentType<DialogueSubmitProps>), {styles});

declare global {
  interface ComponentTypes {
    DialogueSubmit: typeof DialogueSubmitComponent
  }
}
