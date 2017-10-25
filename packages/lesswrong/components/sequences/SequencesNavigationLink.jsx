import { Components, registerComponent, withDocument} from 'meteor/vulcan:core';
import { Posts } from 'meteor/example-forum';
import IconButton from 'material-ui/IconButton'
import React from 'react';
import { withRouter } from 'react-router';

const SequencesNavigationLink = ({
    documentId,
    document,
    documentUrl,
    loading,
    direction,
    router}
  ) => {
    const post = documentId && document
    const className = "sequences-navigation-top-" + direction

    if (post && !loading) {
      if (!documentUrl) {
        if (post.canonicalCollection && post.canonicalCollection.slug) {
          documentUrl = "/" + post.canonicalCollection.slug + "/" + post.slug
        } else {
          documentUrl = "/posts/" + post._id
        }
      }

      return (
        <IconButton
            className={ className }
            iconClassName="material-icons"
            disabled={!post}
            tooltip={post && post.title}
            onTouchTap={() => router.push(documentUrl)}>
            { direction === "left" ? "navigate_before" : "navigate_next" }
         </IconButton>
      )
    } else {
      return (
        <IconButton
            iconStyle={{color:"rgba(0,0,0,.2)"}}
            className={ className }
            iconClassName="material-icons"
            disabled={true}>
            { direction === "left" ? "navigate_before" : "navigate_next" }
         </IconButton>
      )
    }
};

const options = {
  collection: Posts,
  queryName: "SequencesPostNavigationLinkQuery",
  fragmentName: 'SequencesPostNavigationLink',
  totalResolver: false,
}

registerComponent('SequencesNavigationLink', SequencesNavigationLink, [withDocument, options], withRouter);
