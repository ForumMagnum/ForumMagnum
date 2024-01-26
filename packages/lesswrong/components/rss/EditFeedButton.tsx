// import React, { Component } from 'react';
// import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
// import RSSFeeds from '../../lib/collections/rssfeeds/collection.js';
//
// const EditFeedButton = ({feed}: {
//   feed: any
// }) => {
//   const { flash } = useMessages();
//
//   return <Components.SmartForm
//     collection={RSSFeeds}
//     documentId={feed._id}
//     prefilledProps={ {userId: feed.userId} }
//     mutationFragment={getFragment('RSSFeedMutationFragment')}
//     successCallback={feed => {
//       this.props.closeModal();
//       flash("Successfully edited feed", 'success');
//     }}
//     removeSuccessCallback={({documentId, documentTitle}) => {
//       flash("Successfully deleted feed", "success");
//       // todo: handle events in collection callbacks
//       // this.context.events.track("post deleted", {_id: documentId});
//     }}
//     showRemove={true}
//   />
// }
//
// registerComponent('EditFeedButton', EditFeedButton);
