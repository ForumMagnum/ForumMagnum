import React, { Component } from 'react';
import { registerComponent, withUpdate } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import { rssTermsToUrl } from "../../lib/modules/rss_urls.js";
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
import withUser from '../common/withUser';

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
  },
  errorMsg: {
    color: "#9b5e5e"
  },
  link: {
    textDecoration: "underline"
  },
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

    if(this.props.method === "email" && !this.emailFeedExists(this.props.view))
      this.state.view = "curated";
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

  sendVerificationEmail() {
    this.props.updateUser({
      selector: {_id: this.props.currentUser._id},
      data: { whenConfirmationEmailSent: new Date() }
    });
  }

  subscribeByEmail() {
    let mutation = { emailSubscribedToCurated: true }

    if (!Users.emailAddressIsVerified(this.props.currentUser)) {
      // Combine mutations into a single update call.
      // (This reduces the number of server-side callback
      // invocations. In a past version this worked around
      // a bug, now it's just a performance optimization.)
      mutation.whenConfirmationEmailSent = new Date();
    }

    this.props.updateUser({
      selector: {_id: this.props.currentUser._id},
      data: mutation
    })

    this.setState({ subscribedByEmail: true });

  }

  emailSubscriptionEnabled() {
    return this.props.currentUser && this.props.currentUser.email
  }

  emailFeedExists(view) {
    if (view === "curated") return true;
    return false;
  }

  isAlreadySubscribed() {
    if (this.state.view === "curated"
        && this.props.currentUser
        && this.props.currentUser.emailSubscribedToCurated)
      return true;
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
    const { classes, fullScreen, onClose, open, currentUser } = this.props;
    const { view, threshold, method, copiedRSSLink, subscribedByEmail } = this.state;

    const viewSelector = <FormControl key="viewSelector" className={classes.viewSelector}>
      <InputLabel htmlFor="subscribe-dialog-view">Feed</InputLabel>
      <Select
        value={view}
        onChange={ event => this.selectView(event.target.value) }
        disabled={method === "email" && !currentUser}
        inputProps={{ id: "subscribe-dialog-view" }}
      >
        <MenuItem value="curated">Curated</MenuItem>
        <MenuItem value="frontpage" disabled={method === "email"}>Frontpage</MenuItem>
        <MenuItem value="community" disabled={method === "email"}>All Posts</MenuItem>
        <MenuItem value="meta" disabled={method === "email"}>Meta</MenuItem>
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
          <Tab label="RSS" key="tabRSS" value="rss" />
          <Tab label="Email" key="tabEmail" value="email" />
        </Tabs>

        <DialogContent className={classes.content}>
          { method === "rss" && <React.Fragment>
            {viewSelector}

            {(view === "community" || view === "frontpage") && <div>
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
                      key={`labelKarmaThreshold${threshold}`}
                      className={classes.thresholdButton} />
                ) }
              </RadioGroup>
              <DialogContentText className={classes.estimate}>
                That's roughly { postsPerWeek[threshold] } posts per week ({ hoursPerWeek[threshold] } of reading)
              </DialogContentText>
            </div>}

            <TextField
              className={classes.RSSLink}
              label="RSS Link"
              onFocus={this.autoselectRSSLink}
              onClick={this.autoselectRSSLink}
              value={rssTermsToUrl(this.rssTerms())}
              key="rssLinkTextField"
              readOnly
              fullWidth />
          </React.Fragment> }

          { method === "email" && [
            viewSelector,
            !!currentUser ? (
              [
                !this.emailFeedExists(view) && <DialogContentText key="dialogNoFeed" className={classes.errorMsg}>
                  Sorry, there's currently no email feed for {viewNames[view]}.
                </DialogContentText>,
                subscribedByEmail && !Users.emailAddressIsVerified(currentUser) && <DialogContentText key="dialogCheckForVerification" className={classes.infoMsg}>
                  We need to confirm your email address. We sent a link to {currentUser.email}; click the link to activate your subscription.
                </DialogContentText>
              ]
            ) : (
              <DialogContentText key="dialogPleaseLogIn" className={classes.errorMsg}>
                You need to <a className={classes.link} href="/login">log in</a> to subscribe via Email
              </DialogContentText>
            )
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
            (this.isAlreadySubscribed()
              ? <Button color="primary" disabled={true}>
                  You are already subscribed to this feed.
                </Button>
              : <Button
                  color="primary"
                  onClick={ () => this.subscribeByEmail() }
                  disabled={!this.emailFeedExists(view) || subscribedByEmail || !currentUser}
                >{subscribedByEmail ? "Subscribed!" : "Subscribe to Feed"}</Button>
            )
          }
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }
}

const withUpdateOptions = {
  collection: Users,
  fragmentName: 'UsersCurrent',
};

registerComponent("SubscribeDialog", SubscribeDialog,
  withMobileDialog(),
  withUser,
  [withUpdate, withUpdateOptions],
  withStyles(styles, { name: "SubscribeDialog" }));
