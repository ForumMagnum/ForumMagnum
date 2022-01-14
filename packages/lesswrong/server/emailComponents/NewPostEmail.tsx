import React from 'react';
import { postGetPageUrl, postGetLink, postGetLinkTarget } from '../../lib/collections/posts/helpers';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';
import './EmailFormatDate';
import './EmailPostAuthors';
import './EmailContentItemBody';
import './EmailPostDate';
import './EmailFooterRecommendations';

const styles = (theme: ThemeType): JssStyles => ({
  heading: {
    textAlign: "center",
    color: theme.palette.primary.main,
    marginBottom: 30
  },
  headingRow: {
    marginBottom: 8
  },
  
  headingLink: {
    color: "black",
    textDecoration: "none",
    fontWeight: "normal",
    fontFamily: "Arial, sans-serif"
  },
  
  headingHR: {
    width: 210,
    height: 0,
    borderTop: "none",
    borderBottom: "1px solid #aaa",
    marginTop: 50,
    marginBottom: 35,
  },
  hr: {
    marginTop: 30,
    marginBottom: 30,
  },
});

const NewPostEmail = ({documentId, reason, hideRecommendations, classes}: {
  documentId: string,
  reason?: string,
  hideRecommendations?: boolean,
  classes: any,
}) => {
  const { document } = useSingle({
    documentId,
    
    collectionName: "Posts",
    fragmentName: "PostsRevision",
    extraVariables: {
      version: 'String'
    }
  });
  const { EmailPostAuthors, EmailContentItemBody, EmailPostDate, EmailFooterRecommendations } = Components;
  if (!document) return null;
  
  // event location - for online events, attempt to show the meeting link
  let eventLocation: string|JSX.Element = document.location
  if (document.onlineEvent) {
    eventLocation = document.joinEventLink ? <a
      className={classes.onlineEventLocation}
      href={document.joinEventLink}
      target="_blank" rel="noopener noreferrer">
        {document.joinEventLink}
    </a> : "Online Event"
  }

  return (<React.Fragment>
    <div className={classes.heading}>
      <h1>
        <a href={postGetPageUrl(document, true)} className={classes.headingLink}>{document.title}</a>
      </h1>
      
      <hr className={classes.headingHR}/>
      
      <div className={classes.headingRow}>
        <EmailPostAuthors post={document}/>
      </div>
      <div className={classes.headingRow}>
        <EmailPostDate post={document}/>
      </div>
      {document.isEvent && <div className={classes.headingRow}>
        {eventLocation}
      </div>}
      {document.contactInfo && <div className={classes.headingRow}>
        Contact: {document.contactInfo}
      </div>}
      
      {document.url && <div className={classes.headingRow}>
        This is a linkpost for <a href={postGetLink(document)} target={postGetLinkTarget(document)}>{document.url}</a>
      </div>}
    </div>
    
    {document.contents && <EmailContentItemBody className="post-body" dangerouslySetInnerHTML={{
      __html: document.contents.html
    }} />}
    
    <a href={postGetPageUrl(document, true)}>Discuss</a>
    
    {!hideRecommendations && (
      <>
        <hr className={classes.hr}/>
        <EmailFooterRecommendations />
      </>
    )}
    
    <hr className={classes.hr}/>
    
    {reason && `You are receiving this email because ${reason}.`}
  </React.Fragment>);
}

const NewPostEmailComponent = registerComponent("NewPostEmail", NewPostEmail, {styles});

declare global {
  interface ComponentTypes {
    NewPostEmail: typeof NewPostEmailComponent
  }
}
