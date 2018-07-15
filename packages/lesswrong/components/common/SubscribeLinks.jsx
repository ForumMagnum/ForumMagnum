import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import FontIcon from 'material-ui/FontIcon';
import Dialog from 'material-ui/Dialog';
import TextField from 'material-ui/TextField';
import FlatButton from 'material-ui/FlatButton';

const SubscribeIcon = ({className, icon, hoverText, onClick, href}) => {
  return (
    <a className={"subscribeIcon "+className} onClick={onClick} href={href}>
      {icon}
      <div className="subscribeIconHoverText">
        {hoverText}
      </div>
    </a>
  );
}

// Source: https://www.vectorlogo.zone/logos/feedly/index.html
const feedlyIcon = 
  <svg
     xmlns="http://www.w3.org/2000/svg"
     version="1.1"
     id="Layer_1"
     x="0px"
     y="0px"
     viewBox="0 0 64 64"
     width="64"
     height="64">
  <path
     d="m 36.333439,36.428335 -9.953212,9.953211 c -0.168698,0.168699 -0.421746,0.337398 -0.674794,0.337398 h -2.108732 c -0.253047,0 -0.506095,-0.08435 -0.674793,-0.253049 l -2.530477,-2.530477 c -0.421747,-0.421746 -0.421747,-1.012191 0,-1.433937 L 31.441182,31.451729 c 0.421746,-0.421746 1.01219,-0.421746 1.433938,0 l 3.542667,3.542669 c 0.337397,0.421746 0.337397,1.09654 -0.08435,1.433937 m 0,15.014166 -2.530478,2.530479 c -0.168699,0.168697 -0.421746,0.337395 -0.674794,0.337395 h -2.108731 c -0.253048,0 -0.506096,-0.08435 -0.674794,-0.253049 L 27.814162,51.52685 c -0.421746,-0.421746 -0.421746,-1.012191 0,-1.433937 l 3.542668,-3.542668 c 0.421747,-0.421746 1.012191,-0.421746 1.433938,0 l 3.542669,3.542668 c 0.421745,0.253048 0.421745,0.927842 0,1.349588 M 18.957493,38.958812 C 18.788795,39.127511 18.535747,39.29621 18.2827,39.29621 h -2.19308 c -0.253049,0 -0.506096,-0.08435 -0.674795,-0.253048 l -2.530477,-2.530478 c -0.421747,-0.421746 -0.421747,-1.012191 0,-1.433936 L 31.441182,16.521913 c 0.421746,-0.421746 1.01219,-0.421746 1.433938,0 l 3.542667,3.542669 c 0.421747,0.421746 0.421747,1.01219 0,1.433938 z M 37.092582,5.7252098 c -2.783526,-2.6991763 -7.254036,-2.6991763 -9.953211,0 L 2.0876439,30.776936 c -2.78352502,2.699175 -2.78352502,7.254035 0,9.953211 L 19.885335,58.527836 c 1.265238,1.096541 2.867875,1.771336 4.639208,1.771336 h 15.01417 c 1.940033,0 3.711367,-0.759141 4.976605,-2.108731 L 61.975615,40.730147 c 2.69918,-2.699176 2.69918,-7.169686 0,-9.953211 z"
     id="path2-1" />
  </svg>

const dialogStyle = {
  maxWidth: "530px"
};

const copyButtonLabelStyle = {
  color: "rgba(100,169,105,1)"
};


class SubscribeLinks extends Component {
  constructor(props) {
    super(props);
    
    this.state = this.initialState();
  }
  
  initialState() {
    return {
      generalDialogVisible: false,
      rssDialogVisible: false,
      copiedToClipboard: false
    }
  }
  
  clickSubscribeGeneral(event) {
    this.setState({
      generalDialogVisible: true
    })
  }
  clickSubscribeEmail(event) {
    alert("Sorry, not implemented yet")
  }
  clickSubscribeRSS(event) {
    this.setState({
      rssDialogVisible: true
    })
  }
  getRssLink() {
    return this.makeAbsolute("/feed.xml?view="+this.props.section.rssView)
  }
  makeAbsolute(feedLink) {
    if(feedLink.startsWith("http")) {
      return feedLink;
    } else {
      const siteUrl = getSetting('siteUrl', Meteor.absoluteUrl());
      if(siteUrl.endsWith("/") && feedLink.startsWith("/"))
        return siteUrl + feedLink.substr(1);
      else
        return siteUrl + feedLink;
    }
  }
  getFeedlyLink() {
    return "https://www.feedly.com/i/subscription/feed/"+encodeURIComponent(this.getRssLink())
  }
  
  closeAll = (event) => {
    this.setState(this.initialState());
  }
  
  generalSubscriptionDialog() {
    // TODO
    return this.rssDialog()
  }
  
  rssDialog() {
    return (
      <Dialog
        title={"Subscribe to "+this.props.section.label+" with RSS"}
        actions={[
          <CopyToClipboard
            text={this.getRssLink()}
            onCopy={(text, result) => this.setState({copiedToClipboard: true})}>
            <FlatButton labelStyle={copyButtonLabelStyle} label={this.state.copiedToClipboard?"Copied!":"Copy Link"}/>
          </CopyToClipboard>,
          <FlatButton
            label="Close"
            primary={true}
            onClick={this.closeAll}
          />
        ]}
        open={this.state.rssDialogVisible}
        onRequestClose={this.closeAll}
        modal={false}
        contentStyle={dialogStyle}
      >
        <div>{this.props.feedDescription}</div>
        <div>Paste this link into your RSS reader:</div>
        <TextField
          id="rssLinkTextField"
          className="rss-out-url-box"
          type="text"
          onFocus={(event)=>event.target.select()}
          value={this.getRssLink()}
          style={{width:"100%"}}
          readOnly />
        <div>
          (Don't have an RSS reader? Try <a href={this.getFeedlyLink()}>Feedly</a> or
          <a onClick={(e)=>{this.clickSubscribeEmail(e)}}>subscribe by email</a>.)
        </div>
      </Dialog>
    )
  }
  
  render() {
    return (
      <div className="subscribeLinks">
        <a className="subscribeText" onClick={(e) => {this.clickSubscribeGeneral(e)}}>
          Subscribe
        </a>
        <span className="subscribeIcons">
          <SubscribeIcon
            className="subscribeEmail"
            icon={<FontIcon className="material-icons">email</FontIcon>}
            hoverText="via Email"
            onClick={(e) => {this.clickSubscribeEmail(e)}} />
          <SubscribeIcon
            className="subscribeRSS"
            icon={<FontIcon className="material-icons">rss_feed</FontIcon>}
            hoverText="via RSS"
            onClick={(e) => {this.clickSubscribeRSS(e)}} />
          <SubscribeIcon
            className="subscribeFeedly"
            icon={feedlyIcon}
            hoverText="via Feedly"
            href={this.getFeedlyLink()} />
        </span>
        { this.state.rssDialogVisible && this.rssDialog() }
        { this.state.generalDialogVisible && this.generalSubscriptionDialog() }
      </div>
    )
  }
}

registerComponent('SubscribeLinks', SubscribeLinks);
