import React, { Component } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { getFragment } from 'meteor/vulcan:core';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import withUser from '../common/withUser';
import { defaultAlgorithmSettings } from '../../lib/collections/users/recommendationSettings.js';

const withRecommendations = component => {
  // FIXME: For some unclear reason, using a ...fragment in the 'sequence' part
  // of this query doesn't work (leads to a 400 Bad Request), so this is expanded
  // out to a short list of individual fields.
  const recommendationsQuery = gql`
    query RecommendationsQuery($count: Int, $algorithm: JSON) {
      Recommendations(count: $count, algorithm: $algorithm) {
        posts {
          ...PostsList
        }
        resumeReading {
          sequence {
            _id
            title
            gridImageId
            canonicalCollectionSlug
          }
          collection {
            _id
            title
            slug
          }
          lastReadPost {
            ...PostsList
          }
          nextPost {
            ...PostsList
          }
          numRead
          numTotal
          lastReadTime
        }
      }
    }
    ${getFragment("PostsList")}
  `;

  return graphql(recommendationsQuery,
    {
      alias: "withRecommendations",
      options: (props) => ({
        variables: {
          count: props.algorithm?.count || 10,
          algorithm: props.algorithm || defaultAlgorithmSettings,
        }
      }),
      props(props) {
        return {
          recommendationsLoading: props.data.loading,
          recommendations: props.data.Recommendations,
        }
      }
    }
  )(component);
}

const withDismissRecommendation = component => {
  return graphql(gql`
    mutation dismissRecommendation($postId: String) {
      dismissRecommendation(postId: $postId)
    }
  `, {
    props: ({ownProps, mutate}) => ({
      dismissRecommendation: async ({postId}) => {
        await mutate({
          variables: {
            postId: postId
          },
        });
      }
    })
  })(component);
}

class RecommendationsList extends Component {
  state = {
    dismissedRecommendations: {}
  }
  
  dismissAndHideRecommendation(postId) {
    this.props.dismissRecommendation({postId: postId});
    this.setState({
      dismissedRecommendations: {
        ...this.state.dismissedRecommendations,
        [postId]: true
      }
    });
  }
  
  limitResumeReading(resumeReadingList) {
    const { dismissedRecommendations } = this.state;
    // Filter out dismissed recommendations
    const filtered = _.filter(resumeReadingList, r=>!dismissedRecommendations[r.nextPost._id]);
    // Sort by last-interaction time
    let sorted = _.sortBy(filtered, r=>r.lastReadTime);
    sorted.reverse(); //in-place
    // Limit to the three most recent
    const maxEntries = 3;
    if (sorted.length < maxEntries) return sorted;
    return sorted.slice(0, maxEntries);
  }
  
  render() {
    const { recommendations, recommendationsLoading } = this.props;
    const { PostsItem2, PostsLoading } = Components;
    if (recommendationsLoading || !recommendations)
      return <PostsLoading/>
    
    const resumeReadingList = this.limitResumeReading(recommendations.resumeReading);
    
    return <div>
      {resumeReadingList.map(resumeReading => {
        const { nextPost, sequence, collection } = resumeReading;
        return <PostsItem2
          post={nextPost}
          sequenceId={sequence?._id}
          resumeReading={resumeReading}
          dismissRecommendation={() => this.dismissAndHideRecommendation(nextPost._id)}
          key={sequence?._id || collection?._id}
        />
      })}
      {recommendations.posts.map(post =>
        <PostsItem2 post={post} key={post._id}/>)}
      {recommendations.posts.length===0 && recommendations.resumeReading.length==0 &&
        <span>There are no more recommendations left.</span>}
    </div>
  }
}

registerComponent('RecommendationsList', RecommendationsList,
  withRecommendations,
  withDismissRecommendation,
  withUser
);

