import React from 'react';
import { registerComponent, Components, useMulti } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import { withVote } from '../votes/withVote';
import { useCurrentUser } from '../common/withUser';
import { TagRels } from '../../lib/collections/tagRels/collection.js';
import { Link } from '../../lib/reactRouterWrapper.js';

const styles = theme => ({
  root: {
    padding: 16,
  },
  tagName: {
  },
  relevanceLabel: {
  },
  score: {
  },
});

const TagRelCard = ({tagRel, vote, classes}) => {
  const currentUser = useCurrentUser();
  const { VoteButton, Loading, PostsItem2 } = Components;
  
  const { results, loading } = useMulti({
    terms: {
      view: "postsWithTag",
      tagId: tagRel.tag._id,
    },
    collection: TagRels,
    queryName: "tagRelCardQuery",
    fragmentName: "TagRelFragment",
    limit: 3,
    ssr: true,
  });
  
  return <div className={classes.root}>
    <div className={classes.tagName}>{tagRel.tag.name}</div>
    
    <span className={classes.relevanceLabel}>
      Relevance
    </span>
    
    <VoteButton
      orientation="left"
      color="error"
      voteType="Downvote"
      document={tagRel}
      currentUser={currentUser}
      collection={TagRels}
      vote={vote}
    />
    <span className={classes.score}>
      {tagRel.baseScore}
    </span>
    <VoteButton
      orientation="right"
      color="secondary"
      voteType="Upvote"
      document={tagRel}
      currentUser={currentUser}
      collection={TagRels}
      vote={vote}
    />
    
    {loading && <Loading/>}
    {results && results.map((result,i) =>
      <PostsItem2 key={result.post._id} post={result.post} index={i} />
    )}
    <Link to={`/tag/${tagRel.tag.slug}`}>See All</Link>
    
  </div>
}

registerComponent("TagRelCard", TagRelCard,
  withVote,
  withStyles(styles, {name: "TagRelCard"}));
