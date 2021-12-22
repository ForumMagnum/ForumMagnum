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
  },
  
  headingLink: {
    color: "black",
    textDecoration: "none",
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
  console.log('document', document?._id)
  if (!document) return null;
  return (<React.Fragment>
    <div className={classes.heading}>
      <h1>
        <a href={postGetPageUrl(document, true)} className={classes.headingLink}>{document.title}</a>
      </h1>
      
      <hr className={classes.headingHR}/>
      
      <EmailPostAuthors post={document}/><br/>
      <div className="postDate">
        <EmailPostDate post={document}/>
      </div><br/>
      {document.location && <div>
        {document.location}
      </div>}
      {document.contactInfo && <div>
        Contact: {document.contactInfo}
      </div>}
      
      {document.url && <div>
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
