import React from 'react';
import { registerComponent, Components, useMulti } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import { withVote } from '../votes/withVote';
import { useCurrentUser } from '../common/withUser';
import { TagRels } from '../../lib/collections/tagRels/collection.js';
import { Link } from '../../lib/reactRouterWrapper.js';
import { commentBodyStyles } from '../../themes/stylePiping'

const styles = theme => ({
  root: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 8,
    paddingBottom: 8,
    [theme.breakpoints.down('xs')]: {
      width: "95vw",
    },
    [theme.breakpoints.up('sm')]: {
      width: 600,
    }
  },
  relevanceLabel: {
    marginRight: 8,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[600]
  },
  voteButton: {
    display: "inline-block",
    fontSize: 25,
  },
  description: {
    ...commentBodyStyles(theme),
  },
  score: {
    marginLeft: 4,
    marginRight: 4,
  },
});

const previewPostCount = 3;

const TagRelCard = ({tagRel, vote, classes}) => {
  const currentUser = useCurrentUser();
  const { VoteButton, PostsItem2, ContentItemBody, SectionFooter, PostsListPlaceholder } = Components;
  
  const { results } = useMulti({
    terms: {
      view: "postsWithTag",
      tagId: tagRel.tag._id,
    },
    collection: TagRels,
    queryName: "tagRelCardQuery",
    fragmentName: "TagRelFragment",
    limit: previewPostCount,
    ssr: true,
  });
  
  return <div className={classes.root}>
    <span className={classes.relevanceLabel}>
      Relevance
    </span>
    
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
    
    {<ContentItemBody
      dangerouslySetInnerHTML={{__html: tagRel.tag.description?.htmlHighlight}}
      description={`tag ${tagRel.tag.name}`}
      className={classes.description}
    />}
    
    {!results && <PostsListPlaceholder count={previewPostCount}/>}
    {results && results.map((result,i) =>
      <PostsItem2 key={result.post._id} tagRel={result} post={result.post} index={i} />
    )}
    <SectionFooter>
      <Link to={`/tag/${tagRel.tag.slug}`}>See All</Link>
    </SectionFooter>
    
  </div>
}

registerComponent("TagRelCard", TagRelCard,
  withVote,
  withStyles(styles, {name: "TagRelCard"}));
