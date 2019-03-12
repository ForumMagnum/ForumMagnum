import React, { Component } from 'react';
import { registerComponent, withList, Components } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser';

class IFrame extends Component {
  constructor(props) {
    super(props);
    this.iframeRef = React.createRef();
  }
  
  componentDidMount() {
    this._updateIframe();
  }
  componentDidUpdate() {
    this._updateIframe();
  }

  _updateIframe() {
    const iframe = this.iframeRef && this.iframeRef.current;
    if (iframe) {
      const document = iframe.contentDocument;
      document.body.innerHTML = this.props.content;
    }
  }

  render() {
    const { className } = this.props;
    return <iframe className={className} ref={this.iframeRef}/>
  }
}


const styles = theme => ({
  emailPreview: {},
  headerName: {},
  headerContent: {},
  emailBodyFrame: {
    width: 800,
    height: 500,
    marginLeft: "auto",
    marginRight: "auto",
  },
  emailTextVersion: {
    width: 800,
    height: 300,
    overflowY: "scroll",
    border: "1px solid black",
    padding: 10,
    whiteSpace: "pre",
  },
});

export const EmailHistoryPage = ({currentUser}) => {
  if (!currentUser) return <div/>
  
  return <Components.EmailHistory
    terms={{view: "emailHistory", userId: currentUser._id}}
  />
}

registerComponent('EmailHistoryPage', EmailHistoryPage, withUser);

export const EmailHistory = ({results, classes}) => {
  if (!results) return <Components.Loading/>
  
  return results.map((email,i) => <Components.EmailPreview key={i} email={email.properties}/>);
}

registerComponent('EmailHistory', EmailHistory,
  [withList, {
    collectionName: 'LWEvents',
    queryName: 'EmailHistory',
    fragmentName: 'emailHistoryFragment',
    enableTotal: false
  }]
);

export const EmailPreview = ({email, classes}) => {
  return <div className={classes.emailPreview}>
    <div className={classes.emailHeader}>
      <span className={classes.headerName}>Subject: </span>
      <span className={classes.headerContent}>{email.subject}</span>
    </div>
    <div className={classes.emailHeader}>
      <span className={classes.headerName}>To: </span>
      <span className={classes.headerContent}>{email.to}</span>
    </div>
    <IFrame className={classes.emailBodyFrame} content={email.html}/>
    <div className={classes.emailTextVersion}>
      {email.text}
    </div>
  </div>;
}

registerComponent('EmailPreview', EmailPreview,
  withStyles(styles, { name: "EmailHistory" }));
