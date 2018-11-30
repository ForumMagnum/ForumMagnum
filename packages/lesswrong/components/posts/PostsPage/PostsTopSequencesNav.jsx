import React from 'react'
import { registerComponent, Components } from 'meteor/vulcan:core';

const PostsTopSequencesNav = ({classes, post, sequenceId}) => {
  const { SequencesNavigation, CollectionsNavigation } = Components
  const canonicalCollectionSlug = post.canonicalCollectionSlug;
  const title = getNavTitle(post)
  const titleUrl = getNavTitleUrl(post)

  if (sequenceId && !canonicalCollectionSlug) {
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
  } else {
    return null
  }
}

registerComponent('PostsTopSequencesNav', PostsTopSequencesNav)

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
