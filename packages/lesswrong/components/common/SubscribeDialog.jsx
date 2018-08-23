import React, { Component } from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import TextField from '@material-ui/core/TextField';
import { rssTermsToUrl } from "meteor/example-forum";
import { CopyToClipboard } from 'react-copy-to-clipboard';
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
  'community': 'Community',
  'meta': 'Meta',
  'pending': 'pending posts',
  'rejected': 'rejected posts',
  'scheduled': 'scheduled posts',
  'all_drafts': 'all drafts',
}

class SubscribeDialog extends Component {
  constructor(props) {
    super(props);
    this.state = { copiedRSSLink: false };
  }

  rssTerms() {
    return { view: `${this.props.view}-rss`, karmaThreshold: this.props.threshold };
  }

  autoselectRSSLink(event) {
    event.target.select();
  }

  render() {
    const viewSelector = <FormControl className={this.props.classes.viewSelector}>
      <InputLabel htmlFor="subscribe-dialog-view">Feed</InputLabel>
      <Select
        value={this.props.view}
        onChange={ event => this.props.onViewChange(event, event.target.value) }
        inputProps={{ id: "subscribe-dialog-view" }}
      >
        <MenuItem value="curated">Curated</MenuItem>
        <MenuItem value="frontpage">Frontpage</MenuItem>
        <MenuItem value="community">All Posts</MenuItem>
      </Select>
    </FormControl>

    return (
      <Dialog
        fullScreen={this.props.fullScreen}
        open={this.props.open}
        onClose={this.props.onClose}
        className={this.props.className}
      >
        <Tabs
          value={this.props.method}
          indicatorColor="primary"
          textColor="primary"
          onChange={this.props.onMethodChange}
          className={this.props.classes.tabbar}
          fullWidth
        >
          <Tab label="RSS" value="rss" />
          <Tab label="Email" value="email" />
        </Tabs>

        <DialogContent className={this.props.classes.content}>
          { this.props.method === "rss" && [
            viewSelector,

            _.contains(["community", "frontpage"], this.props.view) && <div>
              <DialogContentText>Generate a RSS link to posts in {viewNames[this.props.view]} of this karma and above.</DialogContentText>
              <RadioGroup
                value={this.props.threshold}
                onChange={this.props.onThresholdChange}
                className={this.props.classes.thresholdSelector}
              >
                { [2, 30, 45, 75].map(t => t.toString()).map(threshold =>
                  <FormControlLabel
                      control={<Radio />}
                      label={threshold}
                      value={threshold}
                      className={this.props.classes.thresholdButton} />
                ) }
              </RadioGroup>
              <DialogContentText className={this.props.classes.estimate}>
                That's roughly { postsPerWeek[this.props.threshold] } posts per week ({ hoursPerWeek[this.props.threshold] } of reading)
              </DialogContentText>
            </div>,

            <TextField
              className={this.props.classes.RSSLink}
              label="RSS Link"
              onFocus={this.autoselectRSSLink}
              onClick={this.autoselectRSSLink}
              value={rssTermsToUrl(this.rssTerms())}
              readOnly
              fullWidth />
          ] }

          { this.props.method === "email" && [
            viewSelector
          ] }
        </DialogContent>
        <DialogActions>
          { this.props.method === "rss" &&
            <CopyToClipboard
              text={rssTermsToUrl(this.rssTerms())}
              onCopy={ (text, result) => this.setState({ copiedRSSLink: result }) }
            >
              <Button color="primary">{this.state.copiedRSSLink ? "Copied!" : "Copy Link"}</Button>
            </CopyToClipboard> }
          <Button onClick={this.props.onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }
}

registerComponent("SubscribeDialog", SubscribeDialog, withMobileDialog(), withStyles(styles));
