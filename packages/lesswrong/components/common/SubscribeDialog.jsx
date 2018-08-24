import React, { Component } from 'react';
import { registerComponent, withCurrentUser, withEdit } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import { rssTermsToUrl } from "meteor/example-forum";
import { CopyToClipboard } from 'react-copy-to-clipboard';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import { withStyles } from '@material-ui/core/styles';
import withMobileDialog from '@material-ui/core/withMobileDialog';

const styles = theme => ({
  thresholdSelector: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-evenly"
  },
  estimate: {
    maxWidth: "500px"
  },
  content: {
    padding: `0 ${theme.spacing.unit * 3}px`
  },
  tabbar: {
    marginBottom: theme.spacing.unit * 3
  },
  viewSelector: {
    width: "100%",
    marginBottom: theme.spacing.unit * 2
  },
  RSSLink: {
    marginTop: theme.spacing.unit * 2
  }
});

// Estimated number of hours of reading per week in a frontpage/community feed
// with the given karma threshold. Calculated based on the average number of
// words posted per week on LW2 as of August 2018.
const hoursPerWeek = {
  2: "3 hours",
  30: "2 hours",
  45: "1 hour",
  75: "half an hour"
};

// Estimated number of posts per week in a frontpage/community feed with the
// given karma threshold. Calculated based on the average number of posts per
// week on LW2 as of August 2018.
const postsPerWeek = {
  2: 20,
  30: 11,
  45: 7,
  75: 3
};

const viewNames = {
  'frontpage': 'Frontpage',
  'curated': 'Curated Content',
  'community': 'All Posts',
  'meta': 'Meta',
  'pending': 'pending posts',
  'rejected': 'rejected posts',
  'scheduled': 'scheduled posts',
  'all_drafts': 'all drafts',
}

class SubscribeDialog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      view: this.props.view,
      threshold: "30",
      method: this.props.method,
      copiedRSSLink: false,
      subscribedByEmail: false
    };
  }

  rssTerms() {
    const view = this.state.view;
    let terms = { view: `${view}-rss` };
    if (view === "community" || view === "frontpage") terms.karmaThreshold = this.state.threshold;
    return terms;
  }

  autoselectRSSLink(event) {
    event.target.select();
  }

  // Return true if the current user's account has at least one verified
  // email address.
  emailAddressIsVerified() {
    var emails = this.props.currentUser.emails;
    for (let email of emails) {
      if (email.verified) return true;
    }
    return false;
  }

  sendVerificationEmail() {
    this.props.editMutation({
      documentId: this.props.currentUser._id,
      set: { whenConfirmationEmailSent: new Date() },
      unset: {}
    });
  }

  subscribeByEmail() {
    let mutation = { emailSubscribedToCurated: true }

    if (!this.emailAddressIsVerified()) {
      // Updating whenConfirmationEmailSent sets off a trigger
      // which causes the email to actually be sent.
      //
      // We combine these into one editMutation call to work
      // around a bug in Vulcan's callbacks, where a pair
      // of edits a->b->c will trigger two callbacks that
      // say the edit was a->c, resulting in two confirmation
      // emails sent at once.
      mutation.whenConfirmationEmailSent = new Date();
    }

    this.props.editMutation({
      documentId: this.props.currentUser._id,
      set: mutation,
      unset: {}
    })

    this.setState({ subscribedByEmail: true });

  }

  emailSubscriptionEnabled() {
    return this.props.currentUser && this.props.currentUser.email
  }

  emailFeedExists() {
    if (this.state.view === "curated") return true;
    return false;
  }

  selectMethod(method) {
    this.setState({
      copiedRSSLink: false,
      subscribedByEmail: false,
      method
    })
  }

  selectThreshold(threshold) {
    this.setState({
      copiedRSSLink: false,
      subscribedByEmail: false,
      threshold
    })
  }


  selectView(view) {
    this.setState({
      copiedRSSLink: false,
      subscribedByEmail: false,
      view
    })
  }

  render() {
    const { classes, fullScreen, onClose, open } = this.props;
    const { view, threshold, method, copiedRSSLink, subscribedByEmail } = this.state;

    const viewSelector = <FormControl className={classes.viewSelector}>
      <InputLabel htmlFor="subscribe-dialog-view">Feed</InputLabel>
      <Select
        value={view}
        onChange={ event => this.selectView(event.target.value) }
        inputProps={{ id: "subscribe-dialog-view" }}
      >
        <MenuItem value="curated">Curated</MenuItem>
        <MenuItem value="frontpage">Frontpage</MenuItem>
        <MenuItem value="community">All Posts</MenuItem>
        <MenuItem value="meta">Meta</MenuItem>
      </Select>
    </FormControl>

    return (
      <Dialog
        fullScreen={fullScreen}
        open={open}
        onClose={onClose}
      >
        <Tabs
          value={method}
          indicatorColor="primary"
          textColor="primary"
          onChange={ (event, value) => this.selectMethod(value) }
          className={classes.tabbar}
          fullWidth
        >
          <Tab label="RSS" value="rss" />
          <Tab label="Email" value="email" />
        </Tabs>

        <DialogContent className={classes.content}>
          { method === "rss" && [
            viewSelector,

            (view === "community" || view === "frontpage") && <div>
              <DialogContentText>Generate a RSS link to posts in {viewNames[view]} of this karma and above.</DialogContentText>
              <RadioGroup
                value={threshold}
                onChange={ (event, value) => this.selectThreshold(value) }
                className={classes.thresholdSelector}
              >
                { [2, 30, 45, 75].map(t => t.toString()).map(threshold =>
                  <FormControlLabel
                      control={<Radio />}
                      label={threshold}
                      value={threshold}
                      className={classes.thresholdButton} />
                ) }
              </RadioGroup>
              <DialogContentText className={classes.estimate}>
                That's roughly { postsPerWeek[threshold] } posts per week ({ hoursPerWeek[threshold] } of reading)
              </DialogContentText>
            </div>,

            <TextField
              className={classes.RSSLink}
              label="RSS Link"
              onFocus={this.autoselectRSSLink}
              onClick={this.autoselectRSSLink}
              value={rssTermsToUrl(this.rssTerms())}
              readOnly
              fullWidth />
          ] }

          { method === "email" && [
            viewSelector,
            !this.emailFeedExists() && <DialogContentText>
              Sorry, there's currently no email feed for {viewNames[view]}.
            </DialogContentText>
          ] }
        </DialogContent>
        <DialogActions>
          { method === "rss" &&
            <CopyToClipboard
              text={rssTermsToUrl(this.rssTerms())}
              onCopy={ (text, result) => this.setState({ copiedRSSLink: result }) }
            >
              <Button color="primary">{copiedRSSLink ? "Copied!" : "Copy Link"}</Button>
            </CopyToClipboard> }
          { method === "email" &&
            <Button
              color="primary"
              onClick={ () => this.subscribeByEmail() }
              disabled={!this.emailFeedExists() || subscribedByEmail}
            >{subscribedByEmail ? "Subscribed!" : "Subscribe to Feed"}</Button> }
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }
}

const withEditOptions = {
  collection: Users,
  fragmentName: 'UsersCurrent',
};

registerComponent("SubscribeDialog", SubscribeDialog,
  withMobileDialog(),
  withCurrentUser,
  [withEdit, withEditOptions],
  withStyles(styles));
