import React, { Component } from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import FontIcon from 'material-ui/FontIcon';
import TextField from 'material-ui/TextField';
import { rssTermsToUrl } from "meteor/example-forum";
import { CopyToClipboard } from 'react-copy-to-clipboard';
import FlatButton from 'material-ui/FlatButton';
import Dialog from 'material-ui/Dialog';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Tooltip from '@material-ui/core/Tooltip';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  thresholdSelector: {
    display: "flex",
    flexWrap: "nowrap",
    flexDirection: "row",
    justifyContent: "space-evenly"
  },
  thresholdButton: {

  },
  tooltip: {
    fontSize: ".8rem"
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

const dialogStyle = {
  maxWidth: "530px"
}

const RSSIconStyle = {
  fontSize: "14px",
  color: "white",
  top: "2px",
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
    if (props.user) {
      this.state = {
        rssTerms: { view: "userPosts", userId: props.user._id, karmaThreshold: 2 }
      }
    } else if (props.commentsOn) {
      this.state = {
        rssTerms: { type: "comments", view: "postCommentsNew", postId: props.commentsOn._id, karmaThreshold: 2 }
      }
    } else if(props.view) {
      this.state = {
        rssTerms: { view: props.view, karmaThreshold: 2}
      }
    } else {
      //eslint-disable-next-line no-console
      console.error("Unclear how to build RSS links for: ", props);
      this.state = {
        rssTerms: { view: "rss", karmaThreshold: 2 }
      }
    }
    this.state = {...this.state, open:false, copied:false}
  }

  handleClick = (event) => {
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
      <span className="rss-out-linkbuilder"><span className="rss-out-linkbuilder-button"><div onClick={(e) => {this.handleClick(e)}}><FontIcon className="material-icons" style={RSSIconStyle}>rss_feed</FontIcon> Create an RSS Feed</div></span>
        <Dialog
          title="RSS Link Builder"
          actions={actions}
          modal={false}
          open={this.state.open}
          onRequestClose={this.handleClose}
          contentStyle={dialogStyle}
        >
          <div>
            { (this.props.view === "community-rss" || this.props.view === "frontpage-rss") ? <div>
              <h5>Karma Threshold: {this.state.rssTerms.karmaThreshold} <span style={{fontWeight:"normal"}}>(Roughly {hoursPerWeek[this.state.rssTerms.karmaThreshold]} or {postsPerWeek[this.state.rssTerms.karmaThreshold]} posts per week)</span></h5>
              Generate a RSS link to posts in {viewNames[this.state.rssTerms.view]} of this karma and above.
              <RadioGroup value={""+this.state.rssTerms.karmaThreshold} onChange={this.handleSlider} className={this.props.classes.thresholdSelector}>
                {[2, 30, 45, 75].map(t => `${t}`).map(threshold =>
                  <FormControlLabel
                      control={<Radio />}
                      label={threshold}
                      value={threshold}
                      className={this.props.classes.thresholdButton} />
                )}
              </RadioGroup>
            </div> : null }

            <TextField id={this.props.view + 2} className="rss-out-url-box" type="text" onFocus={this.handleFocus} value={rssTermsToUrl(this.state.rssTerms)} style={{width: "100%"}} readOnly />
          </div>
        </Dialog>
      </span>
    );
  }
}

registerComponent('RSSOutLinkbuilder', RSSOutLinkbuilder, withStyles(styles));
