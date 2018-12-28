import React from 'react';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
});

const NewPostEmail = ({document}) => {
  return (<React.Fragment>
    <div className="heading">
      <h1>
        <a href={document.linkUrl} className="action-link">{document.title}</a>
      </h1>
      
      <hr></hr>
      
      <div className="postAuthor">
        <a href={document.author.pageUrl}>{document.author}</a>
      </div>
      <div className="postDate">
        {document.postedAt}
      </div>
    </div>
    
    <div className="post-body" dangerouslySetInnerHTML={document.htmlBody} />
    
    <a href="{document.pageUrl}">Discuss</a><br/><br/>
    
    You are receiving this email because you are subscribed to new posts on LessWrong.
  </React.Fragment>);
}

export default withStyles(styles)(NewPostEmail);