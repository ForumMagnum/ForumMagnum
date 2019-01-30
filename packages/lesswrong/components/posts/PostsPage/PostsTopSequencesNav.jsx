import React from 'react'
import { registerComponent, Components } from 'meteor/vulcan:core';
import { withRouter } from 'react-router';

const PostsTopSequencesNav = ({post, sequenceId, routes}) => {
  const { SequencesNavigation, CollectionsNavigation } = Components
  const canonicalCollectionSlug = post.canonicalCollectionSlug;
  const title = getNavTitle(post)
  const titleUrl = getNavTitleUrl(post)

  const isSequenceRoute = _.some(routes, r => r.name === "sequencesPost")

  if (sequenceId && isSequenceRoute) {
    return (
      <SequencesNavigation
        documentId={sequenceId}
        post={post} />
    )
  } else if (canonicalCollectionSlug && title && titleUrl) {
    return (
      <CollectionsNavigation
        title={ title }
        titleUrl={ titleUrl }
        nextPostUrl={ post.canonicalNextPostSlug && "/" + post.canonicalCollectionSlug + "/" + post.canonicalNextPostSlug }
        prevPostUrl={ post.canonicalPrevPostSlug && "/" + post.canonicalCollectionSlug + "/" + post.canonicalPrevPostSlug }
        nextPostSlug={post.canonicalNextPostSlug}
        prevPostSlug={post.canonicalPrevPostSlug}
      />
    )
  } else if (sequenceId){
    return (
      <SequencesNavigation
        documentId={sequenceId}
        post={post} />
    )
  } else {
    return null
  }
}

registerComponent('PostsTopSequencesNav', PostsTopSequencesNav, withRouter)

function getNavTitleUrl(post) {
  if (post && post.canonicalSequence && post.canonicalSequence.title) {
    return "/s/" + post.canonicalSequenceId
  } else if (post && post.canonicalCollectionSlug) {
    return "/" + post.canonicalCollectionSlug
  }
}

function getNavTitle(post) {
  if (post && post.canonicalSequence && post.canonicalSequence.title) {
    return post.canonicalSequence.title
  } else if (post && post.canonicalBook && post.canonicalBook.title) {
    return post.canonicalBook.title
  } else if (post && post.canonicalCollection && post.canonicalCollection.title) {
    return post.canonicalCollection.title
  }
}
