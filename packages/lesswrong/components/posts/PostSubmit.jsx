import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { replaceComponent, Components } from 'meteor/vulcan:core';

import Button from '@material-ui/core/Button';

import { withTheme, withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import withUser from '../common/withUser';
import { withRouter } from 'react-router'

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
    flexGrow:1,
    "&:hover": {
      background: "rgba(0,0,0, 0.05)",
    }
  },

  secondaryButton: {
    color: "rgba(0,0,0,0.4)",
  },

  submitButton: {
    color: theme.palette.secondary.main,
    maxWidth:100,
  },
  cancelButton: {
    flexGrow:1,
    [theme.breakpoints.up('md')]: {
      display: "none"
    }
  },
  draft: {
    maxWidth:150,
  }
});

class PostSubmit extends PureComponent {
  state = { submitToFrontpage: true }

  render() {
    const { submitLabel = "Submit", cancelLabel = "Cancel", cancelCallback, document, collectionName, classes, router } = this.props
    const { submitToFrontpage } = this.state
    const { updateCurrentValues } = this.context
    
    // FIXME: Have this use something other than a query parameter so that (among possible other things) it doesn't behave weird when you open a question dialog while viewing an editEvent page
    // const eventForm = router.location && router.location.query && router.location.query.eventForm;
    // const submitToFrontpage = this.state.submitToFrontpage && !eventForm

    return (
      <div className={classes.formSubmit}>
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
          Save as draft
        </Button>

        <Button
          type="submit"
          onClick={() => collectionName === "posts" && updateCurrentValues({draft: false, submitToFrontpage: submitToFrontpage})}
          className={classNames("primary-form-submit-button", classes.formButton, classes.submitButton)}
          variant={collectionName=="users" ? "outlined" : undefined}
        >
          {submitLabel}
        </Button>
      </div>
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
replaceComponent('PostSubmit', PostSubmit,
  withUser, withTheme(), withRouter,
  withStyles(styles, { name: "PostSubmit" })
);

