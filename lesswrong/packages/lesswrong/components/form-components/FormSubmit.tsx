import React from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from '../../lib/vulcan-lib';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import { useCurrentUser } from '../common/withUser';
import { isBookUI, isFriendlyUI } from '../../themes/forumTheme';

export const styles = (theme: ThemeType) => ({
  formButton: {
    fontFamily: theme.typography.fontFamily,
    marginLeft: "5px",

    ...(isFriendlyUI
      ? {
        fontSize: 14,
        fontWeight: 500,
        textTransform: "none",
      }
      : {
        paddingBottom: 2,
        fontSize: 16,
      }),

    "&:hover": {
      background: theme.palette.panelBackground.darken05,
    }
  },

  secondaryButton: {
    color: theme.palette.text.dim40,
  },

  submitButton: isFriendlyUI
    ? {
      background: theme.palette.buttons.alwaysPrimary,
      color: theme.palette.text.alwaysWhite, // Dark mode independent
      "&:hover": {
        background: theme.palette.primary.dark,
      },
    }
    : {
      color: theme.palette.secondary.main,
    },
});

const FormSubmit = ({
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  cancelCallback,
  document,
  collectionName,
  classes,
}: FormButtonProps & {classes: ClassesType<typeof styles>},
{
  updateCurrentValues,
  addToDeletedValues
}: FormComponentContext<any>) => {
  const currentUser = useCurrentUser();

  // NOTE: collectionName was previously annotated with type Lowercase<CollectionNameString>
  // and was used in case-sensitive comparisons with collection names like "posts".
  // Type-annotating more of the forms system said that what should be getting passed
  // is actually a regular CollectionNameString. I'm not sure what's going on here; I
  // suspect that the cases that were being handled by these were actually transferred to
  // other components like PostSubmit at some point, and this is legacy.

  const outlined = isBookUI && collectionName.toLowerCase() === "users";

  return <div className="form-submit">
    {collectionName.toLowerCase() === "posts" && <span className="post-submit-buttons">
      { !document.isEvent &&
        !document.meta &&
        userCanDo(currentUser, 'posts.curate.all') && !document.question &&
          <Button
            type="submit"
            className={classNames(classes.formButton, classes.secondaryButton)}
            onClick={() => {
              void updateCurrentValues({frontpageDate: document.frontpageDate ? null : new Date(), draft: false});
              if (document.frontpageDate) {
                addToDeletedValues('frontpageDate')
              }
            }}
          >
            {document.frontpageDate
              ? "Move to personal blog"
              : "Submit to frontpage" }
          </Button>}

      <Button
        type="submit"
        className={classNames(classes.formButton, classes.secondaryButton)}
        onClick={() => updateCurrentValues({draft: true})}
      >
        Save as draft
      </Button>

      {userCanDo(currentUser, 'posts.curate.all') && !document.meta && !document.question &&
        <Button
          type="submit"
          className={classNames(classes.formButton, classes.secondaryButton)}
          onClick={() => {
            void updateCurrentValues({curatedDate: document.curatedDate ? null : new Date()})
            if (document.curatedDate) {
              addToDeletedValues('curatedDate')
            }
          }}
        >
          {document.curatedDate
            ? "Remove from curated"
            : "Promote to curated"}
        </Button>
      }
    </span>}

    {!!cancelCallback &&
      <Button
        className={classNames("form-cancel", classes.formButton, classes.secondaryButton)}
        onClick={(e) => {
          e.preventDefault();
          cancelCallback(document)
        }}
      >
        {cancelLabel}
      </Button>
    }

    <Button
      type="submit"
      onClick={() => collectionName.toLowerCase() === "posts" && updateCurrentValues({draft: false})}
      className={classNames("primary-form-submit-button", classes.formButton, classes.submitButton)}
      variant={outlined ? "outlined" : undefined}
    >
      {submitLabel}
    </Button>
  </div>
};

(FormSubmit as any).contextTypes = {
  updateCurrentValues: PropTypes.func,
  addToDeletedValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
  addToSubmitForm: PropTypes.func,
}


// Replaces FormSubmit from vulcan-forms.
const FormSubmitComponent = registerComponent('FormSubmit', FormSubmit, {styles});

declare global {
  interface ComponentTypes {
    FormSubmit: typeof FormSubmitComponent
  }
}

