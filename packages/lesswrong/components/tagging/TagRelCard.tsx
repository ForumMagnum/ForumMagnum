import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { useVote } from '../votes/withVote';
import { useCurrentUser } from '../common/withUser';
import { TagRels } from '../../lib/collections/tagRels/collection';
import { Link } from '../../lib/reactRouterWrapper';
import { commentBodyStyles } from '../../themes/stylePiping'
import classNames from 'classnames';
import e from 'express';

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
    marginBottom: 8
  },
  name: {
    fontVariant:"small-caps"
  },
  score: {
    marginLeft: 4,
    marginRight: 4,
  },
  seeAll: {
    ...seeAllStyles(theme)
  },
  relevanceVotingSection: {
    marginTop: 16,
    marginLeft: -16,
    marginRight: -16,
    marginBottom: -16,
    backgroundColor: "rgba(0,0,0,.05)",
    padding: 16,
  },
  noRelevance: {
    cursor: "pointer",
    fontSize: ".8rem",
    ...theme.typography.commentStyle,
    paddingLeft: 6,
    paddingRight: 6,
    paddingTop: 2,
    paddingBottom: 2,
    border: "solid 2px rgba(0,0,0,.3)",
    backgroundColor: "white",
    '&:hover': {
      backgroundColor: "rgba(0,0,0,.15)",
      color: "white",
    },
    color: theme.palette.grey[700],
    borderRadius: 2,
    marginBottom: 3,
    marginRight: 7,
    display: "inline-block",
    textAlign: "center",
    fontWeight:600,
    width: 44
  },
  noSelected: {
    backgroundColor: "rgba(0,0,0,.3)",
    color: "white",
  },
  lowRelevance: {
    cursor: "pointer",
    ...theme.typography.commentStyle,
    fontSize: ".8rem",
    paddingLeft: 6,
    paddingRight: 6,
    paddingTop: 2,
    paddingBottom: 2,
    border: "solid 2px rgba(120,50,50,.4)",
    color: "rgba(120,50,50)",
    backgroundColor: "white",
    '&:hover': {
      backgroundColor: "rgba(120,50,50,.2)",
      color: "white",
    },
    borderRadius: 2,
    marginBottom: 3,
    marginRight: 7,
    display: "inline-block",
    textAlign: "center",
    fontWeight:600,
    width: 44
  },
  lowSelected: {
    backgroundColor: "rgba(120,50,50,.3)",
    color: "white",
  },
  currentlyLow: {
    backgroundColor: "rgba(120,50,50,.2)",
  },
  mediumRelevance: {
    cursor: "pointer",
    ...theme.typography.commentStyle,
    fontSize: ".8rem",
    paddingLeft: 6,
    paddingRight: 6,
    paddingTop: 2,
    paddingBottom: 2,
    border: "solid 2px rgba(180,170,0,.5)",
    color: "rgba(100,100,0)",
    backgroundColor: "white",
    '&:hover': {
      backgroundColor: "rgba(180,170,0,.2)",
      color: "white",
    },
    borderRadius: 2,
    marginBottom: 3,
    marginRight: 7,
    display: "inline-block",
    textAlign: "center",
    fontWeight:600,
    width: 44
  },
  mediumSelected: {
    backgroundColor: "rgba(180,170,0,.4)",
  },
  currentlyMedium: {
    backgroundColor: "rgba(180,170,0,.2)",
  },
  highRelevance: {
    cursor: "pointer",
    ...theme.typography.commentStyle,
    fontSize: ".8rem",
    paddingLeft: 6,
    paddingRight: 6,
    paddingTop: 2,
    paddingBottom: 2,
    display: "inline-block",
    border: "solid 2px rgba(100,170,110,.6)",
    color: "rgba(100,170,110)",
    backgroundColor: "white",
    '&:hover': {
      backgroundColor: "rgba(100,170,110,.4)",
      color: "white",
    },
    borderRadius: 2,
    marginBottom: 3,
    marginRight: 7,
    textAlign: "center",
    fontWeight:600,
    width: 44
  },
  highSelected: {
    backgroundColor: "rgba(100,170,110,.5)",
    color: "white",
  },
  currentlyHigh: {
    backgroundColor: "rgba(100,170,110,.4)",
  },
  topRelevance: {
    cursor: "pointer",
    ...theme.typography.commentStyle,
    fontSize: ".8rem",
    paddingLeft: 6,
    paddingRight: 6,
    paddingTop: 2,
    paddingBottom: 2,
    display: "inline-block",
    border: "solid 2px rgba(100,170,110,1)",
    color: "rgba(100,170,110)",
    backgroundColor: "white",
    '&:hover': {
      backgroundColor: "rgba(100,170,110,.8)",
      color: "white",
    },
    borderRadius: 2,
    marginBottom: 3,
    marginRight: 7,
    textAlign: "center",
    fontWeight: 600,
    width: 44
  },
  topSelected: {
    backgroundColor: "rgba(100,170,110,1)",
    color: "white",
  },
  currentlyTop: {
    backgroundColor: "rgba(100,170,110,.8)",
  },
  buttons: {
    marginTop: 8,
    marginBottom: 8
  },
  relevanceButton: {
    ...commentBodyStyles(theme),
    fontSize: "1rem",
    marginTop: 12,
    marginBottom: 8
  },
  voteOnRelevance: {
    fontStyle: "italic",
    color: theme.palette.grey[600],
  },
  currentRelevance: {
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 6,
    paddingBottom: 6,
    background: theme.palette.grey[100],
    borderRadius: 2,
    marginRight: 10
  },
  voteA: {
    marginLeft: 4
  },
  voteInfo: {
    fontSize: ".85rem",
    fontStyle: "italic"
  }
});

const previewPostCount = 3;

const TagRelCard = ({tagRel, classes}: {
  tagRel: TagRelFragment,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const vote = useVote();
  const { LWTooltip, PostsItem2, ContentItemBody, PostsListPlaceholder } = Components;
  const [showVoting, setShowVoting] = useState(false)
  const [tagVote, setTagVote] = useState("")
  
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

  let currentRelevance = "Medium"
  if (tagVote === "None") { currentRelevance = "Low" }
  if (tagVote === "Low") { currentRelevance = "Medium" }
  if (tagVote === "Medium") { currentRelevance = "Medium" }
  if (tagVote === "High") { currentRelevance = "High" }
  if (tagVote === "Top") { currentRelevance = "High" }
  
  return <div className={classes.root}>
    {/* <Link className={classes.seeAll} to={`/tag/${tagRel.tag.slug}`}>See All</Link>  */}
    <div onMouseOver={()=>setShowVoting(false)}>
      {<ContentItemBody
        dangerouslySetInnerHTML={{__html: tagRel.tag.description?.htmlHighlight}}
        description={`tag ${tagRel.tag.name}`}
        className={classes.description}
      />}
      
      {!results && <PostsListPlaceholder count={previewPostCount}/>}
      {results && results.map((result,i) =>
        <PostsItem2 key={result.post._id} post={result.post} index={i} />
      )}
    </div>
    <div className={classes.relevanceButton} onMouseOver={()=>setShowVoting(true)}>
      <div>
        <span className={classNames(classes.currentRelevance, {
          [classes.currentlyTop]: currentRelevance === "Top",
          [classes.currentlyHigh]: currentRelevance === "High",
          [classes.currentlyMedium]: currentRelevance === "Medium",
          [classes.currentlyLow]: currentRelevance === "Low",
          [classes.currentlyNone]: currentRelevance === "None",
        })}>
          {currentRelevance} Relevance
        </span> 
        <span className={classes.voteOnRelevance}>
          Does this seem wrong? <a className={classes.voteA}>Vote to change</a>
        </span>
      </div>
      <div>
        {showVoting && <div className={classes.relevanceVotingSection}>
          <div>How relevant is this post to the <em>{tagRel.tag.name}</em> tag? </div>
          <div className={classes.buttons}>
            <div>
              <LWTooltip placement="right-end" title="This is a key introductory post, and should be one of the top few posts on the page.">
                <span 
                  className={classNames(classes.topRelevance, {
                    [classes.topSelected]: tagVote === "Top",
                    [classes.currentlyTop]: currentRelevance === "Top",
                  })} 
                  onClick={()=>setTagVote(tagVote === "Top" ? "" : "Top")}>
                    Top
                </span> 
              </LWTooltip>
              <span className={classes.voteInfo}>
                {0 + (tagVote==="Top" ? 2 : 0)} points 
                {tagVote==="Top" ? " (You have voted on this)" : ""}
              </span>
            </div>
            <div>
              <LWTooltip placement="right-end" title="This post is an important contribution to the tag, and should be sorted towards the top of the tag page.">
                <span 
                  className={classNames(classes.highRelevance, {
                    [classes.highSelected]: tagVote === "High",
                    [classes.currentlyHigh]: currentRelevance === "High",
                  })} 
                  onClick={()=>setTagVote(tagVote === "High" ? "" : "High")}>
                    High
                </span> 
              </LWTooltip>
              <span className={classes.voteInfo}>
                {1 + (tagVote==="High" ? 2 : 0)} points 
                {tagVote==="High" ? " (You and one other user have voted on this)" : " (One user has voted on this)" }</span>
            </div>
            <div>
              <LWTooltip placement="right-end" title="This post should be sorted normally, by karma">
                <span 
                  className={classNames(classes.mediumRelevance, {
                    [classes.mediumSelected]: tagVote === "Medium",
                    [classes.currentlyMedium]: currentRelevance === "Medium",
                  })} 
                  onClick={()=>setTagVote(tagVote === "Medium" ? "" : "Medium")}>
                  Med
                </span> 
              </LWTooltip>
              <span className={classes.voteInfo}>
                {2 + (tagVote==="Medium" ? 2 : 0)} points 
                {tagVote==="Medium" ? " (You have one other user have voted on this)" : " (One user has voted on this)"}</span>
            </div>
            <div>
              <LWTooltip placement="right-end" title="Only tangentially relevant. Should be sorted towards the bottom of the tag page">
                <span 
                  className={classNames(classes.lowRelevance, {
                    [classes.lowSelected]: tagVote === "Low",
                    [classes.currentlyLow]: currentRelevance === "Low",
                  })} 
                  onClick={()=>setTagVote(tagVote === "Low" ? "" : "Low")}>
                    Low
                </span> 
              </LWTooltip>
              <span className={classes.voteInfo}>
                {0 + (tagVote==="Low" ? 2 : 0)} points 
                {tagVote==="Low" ? " (You have voted on this)" : ""}
              </span>
            </div>
            <div>
              <LWTooltip placement="right-end" title={`This post shouldn't be tagged with ${tagRel.tag.name}`}>
                <span 
                  className={classNames(classes.noRelevance, {
                    [classes.noSelected]: tagVote === "None",
                    [classes.currentlyNone]: currentRelevance === "None",
                  })} 
                  onClick={()=>setTagVote(tagVote === "None" ? "" : "None")}>
                  None
                </span> 
              </LWTooltip>
              <span className={classes.voteInfo}>
                {0 + (tagVote==="None" ? 2 : 0)} points 
                {tagVote==="None" ? " (You have voted on this)" : ""}
              </span>
            </div>
          </div>
          <div><em>(Based on your karma, your vote weight is 2 points. Relevance is determined by the median point value)</em></div>
        </div>}
      </div>
    </div>
  </div>
}

const TagRelCardComponent = registerComponent("TagRelCard", TagRelCard, {styles});

declare global {
  interface ComponentTypes {
    TagRelCard: typeof TagRelCardComponent
  }
}

