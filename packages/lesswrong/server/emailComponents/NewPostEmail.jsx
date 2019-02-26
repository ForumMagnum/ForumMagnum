import React from 'react';
import { Posts } from '../../lib/collections/posts';
import { withStyles } from '@material-ui/core/styles';
import { Components, registerComponent, withDocument } from 'meteor/vulcan:core';

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

const NewPostEmail = ({document, classes}) => {
  return (<React.Fragment>
    <div className={classes.heading}>
      <h1>
        <a href={Posts.getPageUrl(document, true)} className={classes.headingLink}>{document.title}</a>
      </h1>
      
      <hr className={classes.headingHR}/>
      
      <Components.PostsAuthors post={document}/>
      <div className="postDate">
        {document.postedAt.toString()}
      </div>
    </div>
    
    <div className="post-body" dangerouslySetInnerHTML={{
      __html: document.contents.html
    }} />
    
    <a href={Posts.getPageUrl(document, true)}>Discuss</a><br/><br/>
    
    You are receiving this email because you are subscribed to new posts on LessWrong.
  </React.Fragment>);
}

const withDocumentOptions = {
  collection: Posts,
  queryName: "postsSingleQuery",
  fragmentName: "PostsRevision",
  ssr: true,
};

registerComponent("NewPostEmail", NewPostEmail,
  [withDocument, withDocumentOptions],
  withStyles(styles, {name: "NewPostEmail"}));