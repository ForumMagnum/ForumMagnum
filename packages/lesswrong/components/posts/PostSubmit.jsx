import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from 'meteor/vulcan:core';

import Button from '@material-ui/core/Button';

import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import withUser from '../common/withUser';

const styles = theme => ({
  formSubmit: {
    display: "flex",
    justifyContent: "flex-end",
    flexWrap: "wrap",
  },
  formButton: {
    paddingBottom: 4,
    fontFamily: theme.typography.commentStyle.fontFamily,
    fontSize: 16,
    marginLeft: 5,
    fontWeight: 500,
    "&:hover": {
      background: "rgba(0,0,0, 0.05)",
    }
  },

  secondaryButton: {
    color: "rgba(0,0,0,0.4)",
  },

  submitButton: {
    color: theme.palette.secondary.main,
  },
  cancelButton: {
    flexGrow:1,
    [theme.breakpoints.up('md')]: {
      display: "none"
    }
  },
  draft: {
    marginLeft: 'auto'
  }
});

class PostSubmit extends PureComponent {
  render() {
    const { submitLabel = "Submit", cancelLabel = "Cancel", saveDraftLabel = "Save as draft", cancelCallback, document, collectionName, classes } = this.props
    const { updateCurrentValues } = this.context

    return (
      <React.Fragment>
        {!!cancelCallback &&
          <div className={classes.cancelButton}>
            <Button
              className={classNames("form-cancel", classes.formButton, classes.secondaryButton)}
              onClick={(e) => {
                e.preventDefault();
                cancelCallback(document)
              }}
            >
              {cancelLabel}
            </Button>
          </div>
        }

        <Button type="submit"
          className={classNames(classes.formButton, classes.secondaryButton, classes.draft)}
          onClick={() => updateCurrentValues({draft: true})}
        >
          {saveDraftLabel}
        </Button>
        
        <Button
          type="submit"
          onClick={() => collectionName === "Posts" && updateCurrentValues({draft: false})}
          className={classNames("primary-form-submit-button", classes.formButton, classes.submitButton)}
          variant={collectionName=="users" ? "outlined" : undefined}
        >
          {submitLabel}
        </Button>
      </React.Fragment>
    );
  }
}

PostSubmit.propTypes = {
  submitLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  cancelCallback: PropTypes.func,
  document: PropTypes.object,
  collectionName: PropTypes.string,
  classes: PropTypes.object,
};

PostSubmit.contextTypes = {
  updateCurrentValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
  addToSubmitForm: PropTypes.func,
}


// Replaces FormSubmit from vulcan-forms.
registerComponent('PostSubmit', PostSubmit,
  withUser, 
  withStyles(styles, { name: "PostSubmit" })
);

