import React, { Component } from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import Popover from 'material-ui/Popover';
import IconButton from 'material-ui/IconButton';
import RssIcon from 'material-ui/svg-icons/communication/rss-feed';
import TextField from 'material-ui/TextField';
import { rssTermsToUrl } from "meteor/example-forum";

class RSSOutLinkbuilder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
    }
    if (props.user) {
      this.state.rssTerms = { view: "userPosts", userId: props.user._id, karmaThreshold: "0" };
    } else if (props.commentsOn) {
      this.state.rssTerms = { type: "comments", view: "postCommentsNew", postId: props.commentsOn._id, karmaThreshold: "0" };
    } else {
      console.log("Unclear how to build RSS links for:");
      console.log(props);
      this.state.rssTerms = { view: "rss", karmaThreshold: "0" };
    }
  }

  handleTouchTap = (event) => {
    event.preventDefault();
    this.setState({
      open: !this.state.open,
    });
  };

  handleFocus = (event) => {
    event.target.select();
  };

  handleKarmaThresholdChanged = (event) => {
    const newRssTerms = {...this.state.rssTerms, karmaThreshold: event.target.value};
    this.setState({
      rssTerms: newRssTerms,
    });
  };

  render() {
    return (
      <div className="rss-out-linkbuilder">
        <IconButton onTouchTap={(e) => {this.handleTouchTap(e)}}> <RssIcon color="rgba(0,0,0,0.5)" /> </IconButton>
        <div className={this.state.open ? "rss-out-linkbuilder-content" : "rss-out-linkbuilder-content hidden"} >
          <div className="rss-out-linkbuilder-top">
            <span className="rss-out-linkbuilder-header">RSS Feed</span>
          </div>
          <span className="rss-out-karma-threshold-label">Karma Threshold:</span>
          <TextField onChange={this.handleKarmaThresholdChanged} className="rss-out-karma-threshold" type="number" min="0" step="1" defaultValue={this.state.rssTerms.karmaThreshold} />
          <TextField className="rss-out-url-box" type="text" onFocus={this.handleFocus} value={rssTermsToUrl(this.state.rssTerms)} readOnly />
        </div>
      </div>
    );
  }
}

registerComponent('RSSOutLinkbuilder', RSSOutLinkbuilder);
