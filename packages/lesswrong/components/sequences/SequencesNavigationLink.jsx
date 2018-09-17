import { Components, registerComponent, withDocument} from 'meteor/vulcan:core';
import { Posts } from 'meteor/example-forum';
import IconButton from 'material-ui/IconButton'
import React from 'react';
import { withRouter } from 'react-router';
import defineComponent from '../../lib/defineComponent';

const SequencesNavigationLink = ({
    slug,
    document,
    documentId,
    documentUrl,
    loading,
    direction,
    router}
  ) => {
    const post = (slug || documentId) && document
    const className = "sequences-navigation-top-" + direction
    const iconStyle = !slug && !documentId ? {color: "rgba(0,0,0,.2)"} : {}
    return (
      <IconButton
        iconStyle={ iconStyle }
        className={ className }
        disabled={ !slug && !documentId }
        iconClassName="material-icons"
        tooltip={post && post.title}
        onClick={() => router.push(documentUrl)}>
        { direction === "left" ? "navigate_before" : "navigate_next" }
       </IconButton>
     )
};

const options = {
  collection: Posts,
  queryName: "SequencesPostNavigationLinkQuery",
  fragmentName: 'SequencesPostNavigationLink',
  totalResolver: false,
}

export default defineComponent({
  name: 'SequencesNavigationLink',
  component: SequencesNavigationLink,
  hocs: [ [withDocument, options], withRouter ]
});
