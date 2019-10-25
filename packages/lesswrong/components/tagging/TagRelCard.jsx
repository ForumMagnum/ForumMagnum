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
  relevanceLabel: {
    marginRight: 8,
  },
  voteButton: {
    display: "inline-block",
    fontSize: 25,
  },
  description: {
    ...postBodyStyles(theme),
  },
  score: {
    marginLeft: 4,
    marginRight: 4,
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
    <span className={classes.relevanceLabel}>
      Relevance
    </span>
    
    {<ContentItemBody
      dangerouslySetInnerHTML={{__html: tagRel.tag.description?.html}}
      description={`tag ${tag.name}`}
      className={classes.description}
    />}
    
    <div className={classes.voteButton}>
      <VoteButton
        orientation="left"
        color="error"
        voteType="Downvote"
        document={tagRel}
        currentUser={currentUser}
        collection={TagRels}
        vote={vote}
      />
    </div>
    <span className={classes.score}>
      {tagRel.baseScore}
    </span>
    <div className={classes.voteButton}>
      <VoteButton
        orientation="right"
        color="secondary"
        voteType="Upvote"
        document={tagRel}
        currentUser={currentUser}
        collection={TagRels}
        vote={vote}
      />
    </div>
    
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
