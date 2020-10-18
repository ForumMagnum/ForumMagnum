// /*
//
// Button used to add a new feed to a user profile
//
// */
//
// import React, { Component } from 'react';
// import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
// import { withRouter } from '../../lib/reactRouterWrapper.jsx';
// import RSSFeeds from '../../lib/collections/rssfeeds/collection.js';
// import withUser from '../common/withUser';
//
// class editFeedButton extends Component {
//   render() {
//     return (
//         <Components.SmartForm
//           collection={RSSFeeds}
//           documentId={this.props.feed._id}
//           prefilledProps={ {userId: this.props.feed.userId} }
//           mutationFragment={getFragment('RSSFeedMutationFragment')}
//           successCallback={feed => {
//             this.props.closeModal();
//             this.props.flash("Successfully edited feed", 'success');
//           }}
//           removeSuccessCallback={({documentId, documentTitle}) => {
//             this.props.flash("Successfully deleted feed", "success");
//             // todo: handle events in collection callbacks
//             // this.context.events.track("post deleted", {_id: documentId});
//           }}
//           showRemove={true}
//         />
//       )
//     }
// }
//
// registerComponent('editFeedButton', editFeedButton, withUser, withRouter);
