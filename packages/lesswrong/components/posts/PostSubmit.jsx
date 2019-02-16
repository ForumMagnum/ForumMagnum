import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { replaceComponent } from 'meteor/vulcan:core';

import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import Checkbox from '@material-ui/core/Checkbox';

import { withTheme, withStyles } from '@material-ui/core/styles';
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
  },
  submitToFrontpageWrapper: {
    flexGrow: 3,
    [theme.breakpoints.down('sm')]: {
      width: "100%",
      order:1
    }
  },
  submitToFrontpage: {
    display: "flex",
    alignItems: "center",
    maxWidth: 300,
    [theme.breakpoints.down('sm')]: {
      width: "100%",
    }
  },
  checkboxLabel: {
    fontWeight:500,
    fontFamily: theme.typography.commentStyle.fontFamily,
    fontSize: 16,
    color: "rgba(0,0,0,0.4)",
  },
  tooltip: {
    '& ul': {
      paddingTop: 0,
      paddingBottom: 0,
      marginTop: theme.spacing.unit/2,
      paddingLeft: theme.spacing.unit*3,
    },
    '& p': {
      marginTop: theme.spacing.unit/2,
      marginBottom: theme.spacing.unit/2
    }
  },
  guidelines: {
    fontStyle: "italic"
  },
  cancelButton: {
    [theme.breakpoints.up('md')]: {
      display: "none"
    }
  },
  draft: {

  }
});

class PostSubmit extends PureComponent {
  state = { submitToFrontpage: true}

  render() {
    const { submitLabel = "Submit", cancelLabel = "Cancel", cancelCallback, document, collectionName, classes } = this.props

    const { updateCurrentValues } = this.context

    const { submitToFrontpage } = this.state

    return (
      <div className={classes.formSubmit}>
        <div className={classes.submitToFrontpageWrapper}>
            <Tooltip title={<div className={classes.tooltip}>
              <p>LW moderators will consider this post for frontpage</p>
              <p className={classes.guidelines}>Things to aim for:</p>
              <ul>
                <li className={classes.guidelines}>
                  Usefulness, novelty and fun
                </li>
                <li className={classes.guidelines}>
                  Timeless content (minimize reference to current events)
                </li>
                <li className={classes.guidelines}>
                  Explain rather than persuade
                </li>
              </ul>
            </div>
            }>
              <div className={classes.submitToFrontpage}>
                <Checkbox checked={submitToFrontpage} onClick={() => this.setState({submitToFrontpage: !submitToFrontpage})}/>
                <span className={classes.checkboxLabel}>Moderators may promote</span>
              </div>
            </Tooltip>
        </div>

        {!!cancelCallback &&
          <Button
            className={classNames("form-cancel", classes.formButton, classes.secondaryButton, classes.cancelButton)}
            onClick={(e) => {
              e.preventDefault();
              cancelCallback(document)
            }}
          >
            {cancelLabel}
          </Button>
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
  withUser, withTheme(),
  withStyles(styles, { name: "PostSubmit" })
);
