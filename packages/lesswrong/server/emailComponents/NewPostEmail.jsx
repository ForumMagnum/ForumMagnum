import React from 'react';
import { Posts } from '../../lib/collections/posts';
import { withStyles } from '@material-ui/core/styles';
import { Components, registerComponent, withDocument } from 'meteor/vulcan:core';
import './EmailFormatDate.jsx';
import './EmailPostAuthors.jsx';

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

const NewPostEmail = ({document, classes, reason}) => {
  const { EmailPostAuthors, EmailFormatDate } = Components;
  return (<React.Fragment>
    <div className={classes.heading}>
      <h1>
        <a href={Posts.getPageUrl(document, true)} className={classes.headingLink}>{document.title}</a>
      </h1>
      
      <hr className={classes.headingHR}/>
      
      <EmailPostAuthors post={document}/><br/>
      <div className="postDate">
        <EmailFormatDate date={document.postedAt}/>
      </div><br/>
    </div>
    
    <div className="post-body" dangerouslySetInnerHTML={{
      __html: document.contents.html
    }} />
    
    <a href={Posts.getPageUrl(document, true)}>Discuss</a><br/><br/>
    
    {reason && `You are receive this email because ${reason}.`}
  </React.Fragment>);
}

const withDocumentOptions = {
  collection: Posts,
  queryName: "postsSingleQuery",
  fragmentName: "PostsRevision",
  ssr: true,
  extraVariables: {
    version: 'String'
  }
};

registerComponent("NewPostEmail", NewPostEmail,
  [withDocument, withDocumentOptions],
  withStyles(styles, {name: "NewPostEmail"}));