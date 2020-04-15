import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { useVote } from '../votes/withVote';
import { useCurrentUser } from '../common/withUser';
import { TagRels } from '../../lib/collections/tagRels/collection';
import { Link } from '../../lib/reactRouterWrapper';
import { commentBodyStyles } from '../../themes/stylePiping'

export const seeAllStyles = theme => ({
  padding: theme.spacing.unit,
  display: "block",
  textAlign: "right",
  color: theme.palette.primary.main,
  ...theme.typography.commentStyle
})

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
    },
    ...theme.typography.commentStyle,
  },
  relevanceLabel: {
    marginRight: 8,
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
  seeAll: {
    ...seeAllStyles(theme)
  }
});

const previewPostCount = 3;

const TagRelCard = ({tagRel, classes}: {
  tagRel: TagRelFragment,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const vote = useVote();
  const { VoteButton, PostsItem2, ContentItemBody, PostsListPlaceholder } = Components;
  
  const { results } = useMulti({
    terms: {
      view: "postsWithTag",
      tagId: tagRel.tag._id,
    },
    collection: TagRels,
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
      <PostsItem2 key={result.post._id} post={result.post} index={i} />
    )}
    <Link className={classes.seeAll} to={`/tag/${tagRel.tag.slug}`}>See All</Link>
    
  </div>
}

const TagRelCardComponent = registerComponent("TagRelCard", TagRelCard, {styles});

declare global {
  interface ComponentTypes {
    TagRelCard: typeof TagRelCardComponent
  }
}

