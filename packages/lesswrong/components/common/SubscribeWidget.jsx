import React, { Component } from 'react';
import _ from 'lodash';
import { registerComponent } from 'meteor/vulcan:core';
import FontIcon from 'material-ui/FontIcon';
import TextField from 'material-ui/TextField';
import { rssTermsToUrl } from "meteor/example-forum";
import { CopyToClipboard } from 'react-copy-to-clipboard';
import FlatButton from 'material-ui/FlatButton';
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

const styles = theme => ({
  thresholdSelector: {
    display: "flex",
    flexWrap: "nowrap",
    flexDirection: "row",
    justifyContent: "space-evenly"
  },
  estimate: {
    width: "500px"
  },
  tooltip: {
    fontSize: ".8rem"
  },
  content: {
    padding: "0 24px"
  },
  icon: {
    fontSize: "14px",
    color: "black",
  },
  tabbar: {
    marginBottom: "24px"
  },
  viewSelector: {
    width: "100%",
    marginBottom: "18px"
  },
  subscribeButton: {
    display: "inline-block",
    marginLeft: "10px",
    opacity: "0.4",
    "&:hover": {
      opacity: "0.15"
    }
  },
  buttons: {
    marginTop: "-12px",
    marginBottom: "6px"
  }
});

const hoursPerWeek = {
  2: "3 hours",
  30: "2 hours",
  45: "1 hour",
  75: "half an hour"
};

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
    return { view: this.props.view + "-rss", karmaThreshold: this.props.threshold };
  }

  handleRSSLinkFocus = (event) => {
    event.target.select();
  }

  handleMethodChange = (event, method) => {
    this.props.onMethodChange(method);
  }

  handleThresholdChange = (event, threshold) => {
    this.props.onThresholdChange(threshold);
  }

  handleViewChange = (event) => {
    this.props.onViewChange(event.target.value);
  }

  handleClose = (event) => {
    this.props.onClose(event);
  }

  render() {
    const viewSelector = <FormControl className={this.props.classes.viewSelector}>
      <InputLabel htmlFor="subscribe-dialog-view">Feed</InputLabel>
      <Select
        value={this.props.view}
        onChange={this.handleViewChange}
        inputProps={{ id: "subscribe-dialog-view" }}
      >
        <MenuItem value="curated">Curated</MenuItem>
        <MenuItem value="frontpage">Frontpage</MenuItem>
        <MenuItem value="community">All Posts</MenuItem>
      </Select>
    </FormControl>;

    const closeButton = <FlatButton
      label="Close"
      primary={true}
      onClick={this.handleClose} />

    return (
      <Dialog
        open={this.props.open}
        onClose={this.props.onClose}
        className={this.props.className}
      >
        <Tabs
          value={this.props.method}
          indicatorColor="primary"
          textColor="primary"
          onChange={this.handleMethodChange}
          className={this.props.classes.tabbar}
          fullWidth
        >
          <Tab label="RSS" value="rss" />
          <Tab label="Email" value="email" />
        </Tabs>

        { this.props.method === "rss" && [
          <DialogContent className={this.props.classes.content}>
            { viewSelector }

            { _.includes(["community", "frontpage"], this.props.view) && <div>
              <DialogContentText>Generate a RSS link to posts in {viewNames[this.props.view]} of this karma and above.</DialogContentText>
              <RadioGroup
                value={this.props.threshold}
                onChange={this.handleThresholdChange}
                className={this.props.classes.thresholdSelector}
              >
                { [2, 30, 45, 75].map(t => `${t}`).map(threshold =>
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
            </div> }

            <TextField id={this.props.view + 2} className="rss-out-url-box" type="text" onFocus={this.handleRSSLinkFocus} value={rssTermsToUrl(this.rssTerms())} style={{width: "100%"}} readOnly />
          </DialogContent>,
          <DialogActions>
            <CopyToClipboard text={rssTermsToUrl(this.rssTerms())}
              onCopy={(text, result) => this.setState({copiedRSSLink: result})}>
              <FlatButton labelStyle={{color: "rgba(100, 169, 105, 1)"}} label={this.state.copiedRSSLink ? "Copied!" : "Copy Link"} />
            </CopyToClipboard>
            { closeButton }
          </DialogActions>
        ] }

        { this.props.method === "email" && [
          <DialogContent className={this.props.classes.content}>
            { viewSelector }
          </DialogContent>,
          <DialogActions>
            { closeButton }
          </DialogActions>
        ] }
      </Dialog>
    );
  }
}

const SubscribeDialogStyled = withStyles(styles)(SubscribeDialog);

class SubscribeWidget extends Component {
  constructor(props) {
    super(props);
    this.state = {
      view: props.view,
      karmaThreshold: "2",
      subscriptionMethod: "email",
      dialogOpen: false
    };
  }

  componentWillReceiveProps({ view }) {
    this.setState({ view });
  }

  openDialog(method) {
    this.setState({
      subscriptionMethod: method,
      dialogOpen: true
    });
  }

  render() {
    return (
      <div className={this.props.classes.buttons}>
        <div className={this.props.classes.subscribeButton} onClick={ () => this.openDialog("rss") }>
          <FontIcon className={`material-icons ${this.props.classes.icon}`}>rss_feed</FontIcon>
        </div>
        <div className={this.props.classes.subscribeButton} onClick={ () => this.openDialog("email") }>
          <FontIcon className={`material-icons ${this.props.classes.icon}`}>email</FontIcon>
        </div>
        <SubscribeDialogStyled
          open={this.state.dialogOpen}
          onClose={ () => this.setState({ dialogOpen: false })}
          view={this.state.view}
          onViewChange={ view => this.setState({ view }) }
          threshold={this.state.karmaThreshold}
          onThresholdChange={ karmaThreshold => this.setState({ karmaThreshold }) }
          method={this.state.subscriptionMethod}
          onMethodChange={ subscriptionMethod => this.setState({ subscriptionMethod }) }
          className="subscribe-dialog" />
      </div>
    );
  }
}

registerComponent('SubscribeWidget', SubscribeWidget, withStyles(styles));
