import React, { Component } from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import IconButton from 'material-ui/IconButton';
import FontIcon from 'material-ui/FontIcon';
import TextField from 'material-ui/TextField';
import { rssTermsToUrl } from "meteor/example-forum";
import { CopyToClipboard } from 'react-copy-to-clipboard';
import FlatButton from 'material-ui/FlatButton';
import Dialog from 'material-ui/Dialog';
import Slider from 'material-ui/Slider';



const dialogStyle = {
  maxWidth: "530px"
}

const RSSIconStyle = {
  fontSize: "14px",
  color: "rgba(0,0,0,0.6)",
  top: "1px",
}

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

class RSSOutLinkbuilder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      copied: false,
    }
    if (props.user) {
      this.state = {
        rssTerms: { view: "userPosts", userId: props.user._id, karmaThreshold: "0" }
      }
    } else if (props.commentsOn) {
      this.state = {
        rssTerms: { type: "comments", view: "postCommentsNew", postId: props.commentsOn._id, karmaThreshold: "0" }
      }
    } else if(props.view) {
      this.state = {
        rssTerms: { view: props.view, karmaThreshold: "0"}
      }
    } else {
      console.log("Unclear how to build RSS links for: ");
      console.log(props);
      this.state = {
        rssTerms: { view: "rss", karmaThreshold: "0" }
      }
    }
  }

  handleTouchTap = (event) => {
    event.preventDefault();
    this.setState({
      open: !this.state.open,
    });
  };

  handleClose = (event) => {
    this.setState({
      open: false,
    })
  }

  handleFocus = (event) => {
    event.target.select();
  };

  handleSlider = (event, value) => {
    const newRssTerms = {...this.state.rssTerms, karmaThreshold: value};
    this.setState({
      rssTerms: newRssTerms,
    });
  };

  render() {
    const actions = [
      <CopyToClipboard text={rssTermsToUrl(this.state.rssTerms)}
        onCopy={(text, result) => this.setState({copied: result})}>
        <FlatButton labelStyle={{color: "rgba(100, 169, 105, 1)"}} label={this.state.copied ? "Copied!" : "Copy Link"}/>
      </CopyToClipboard>,
      <FlatButton
        label="Close"
        primary={true}
        onClick={this.handleClose}
      />
    ];
    return (
      <span className="rss-out-linkbuilder">
        <span className="rss-out-linkbuilder-button"> <FontIcon onTouchTap={(e) => {this.handleTouchTap(e)}} className="material-icons" style={RSSIconStyle}>rss_feed</FontIcon> </span>
        <Dialog
          title="RSS Link Builder"
          actions={actions}
          modal={false}
          open={this.state.open}
          onRequestClose={this.handleClose}
          contentStyle={dialogStyle}
        >
          <div>
            <h5>Karma Threshold: {this.state.rssTerms.karmaThreshold}</h5>
            Generate a RSS link to posts in {viewNames[this.state.rssTerms.view]} of this karma and above.
            <Slider
              min={0}
              max={100}
              step={1}
              value={this.state.rssTerms.karmaThreshold}
              onChange={this.handleSlider}
              style={{width: "100%"}}
            />
            <TextField id={this.props.view + 2} className="rss-out-url-box" type="text" onFocus={this.handleFocus} value={rssTermsToUrl(this.state.rssTerms)} style={{width: "100%"}} readOnly />
          </div>
        </Dialog>
      </span>
    );
  }
}

registerComponent('RSSOutLinkbuilder', RSSOutLinkbuilder);
