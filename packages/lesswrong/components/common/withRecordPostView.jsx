import React from 'react';
import { getActions, withMutation } from 'meteor/vulcan:core';
import compose from 'recompose/compose';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import withNewEvents from '../../lib/events/withNewEvents.jsx';

export const withRecordPostView = (Component) => {
  const mapStateToProps = state => ({ postsViewed: state.postsViewed });
  const mapDispatchToProps = dispatch => bindActionCreators(getActions().postsViewed, dispatch);

  async function recordPostView(props, extraEventProperties) {
    try {

      // destructure the relevant props
      const {
        // from the parent component, used in withDocument, GraphQL HOC
        documentId,
        // from connect, Redux HOC
        setViewed,
        postsViewed,
        // from withMutation, GraphQL HOC
        increasePostViewCount,
        
        document,
        currentUser,
        recordEvent,
      } = props;

      // a post id has been found & it's has not been seen yet on this client session
      if (documentId && !postsViewed.includes(documentId)) {

        // Trigger the asynchronous mutation with postId as an argument
        // Deliberately not awaiting, because this should be fire-and-forget
        await increasePostViewCount({postId: documentId});

        // Update the redux store
        setViewed(documentId);
      }

      //LESSWRONG: register page-visit event
      if(currentUser) {
        const eventProperties = {
          userId: currentUser._id,
          important: false,
          intercom: true,
          ...extraEventProperties
        };

        if(document) {
          eventProperties.documentId = document._id;
          eventProperties.postTitle = document.title;
        } else if (documentId){
          eventProperties.documentId = documentId;
        }
        recordEvent('post-view', true, eventProperties);
      }
    } catch(error) {
      console.log("recordPostView error:", error); // eslint-disable-line
    }
  }
  
  function ComponentWithRecordPostView(props) {
    return <Component {...props} recordPostView={recordPostView}/>
  }
  
  return compose(
    withMutation({
      name: 'increasePostViewCount',
      args: {postId: 'String'},
    }),
    withNewEvents,
    connect(mapStateToProps, mapDispatchToProps),
  )(ComponentWithRecordPostView);
}

export default withRecordPostView;