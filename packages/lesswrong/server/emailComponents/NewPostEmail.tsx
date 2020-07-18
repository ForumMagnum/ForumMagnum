import React from 'react';
import { Posts } from '../../lib/collections/posts';
import { Components, registerComponent } from '../vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import './EmailFormatDate';
import './EmailPostAuthors';
import './EmailContentItemBody';
import './EmailPostDate';

const styles = theme => ({
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
});

const NewPostEmail = ({documentId, classes, reason}: {
  documentId: string,
  classes: any,
  reason?: string,
}) => {
  const { document } = useSingle({
    documentId,
    collection: Posts,
    fragmentName: "PostsRevision",
    extraVariables: {
      version: 'String'
    }
  });
  const { EmailPostAuthors, EmailContentItemBody, EmailPostDate } = Components;
  if (!document) return null;
  return (<React.Fragment>
    {reason && `You are receiving this email because ${reason}.`}
    <div className={classes.heading}>
      <h1>
        <a href={Posts.getPageUrl(document, true)} className={classes.headingLink}>{document.title}</a>
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
    </div>
    
    <EmailContentItemBody className="post-body" dangerouslySetInnerHTML={{
      __html: document.contents.html
    }} />
    
    <a href={Posts.getPageUrl(document, true)}>Discuss</a><br/><br/>
    
  </React.Fragment>);
}

const NewPostEmailComponent = registerComponent("NewPostEmail", NewPostEmail, {styles});

declare global {
  interface ComponentTypes {
    NewPostEmail: typeof NewPostEmailComponent
  }
}
