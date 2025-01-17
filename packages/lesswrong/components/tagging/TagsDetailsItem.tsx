import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { Link, QueryLink } from '../../lib/reactRouterWrapper';
import { useCurrentUser } from '../common/withUser';
import { EditTagForm } from './EditTagPage';
import { useMulti } from '../../lib/crud/withMulti';
import { useLocation } from '../../lib/routeUtil';
import classNames from 'classnames'
import { getVotingSystemByName } from '@/lib/voting/votingSystems';

const styles = (theme: ThemeType) => ({
  root: {
    background: theme.palette.panelBackground.default,
    ...theme.typography.commentStyle,
    display: "flex",
    flexWrap: "wrap",
    // justifyContent: "space-between",
    borderBottom: theme.palette.border.faint,
  },
  description: {
    width: 580,
    paddingRight: 20,
    paddingTop: 12,
    paddingBottom: 10,
    paddingLeft: 20,
    verticalAlign: "top",
    [theme.breakpoints.down('xs')]: {
      width: "100%",
      maxWidth: "unset"
    }
  },
  collapsedDescription: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: 12,
  },
  edit: {
    fontSize: "1rem",
    color: theme.palette.grey[500],
    marginTop: 10,
  },
  postCount: {
    fontSize: "1rem",
    color: theme.palette.grey[500],
    marginBottom: 10,
    display: "block"
  },
  posts: {
    // width: 410,
    padding: 20,
    paddingBottom: 10,
    [theme.breakpoints.down('sm')]: {
      width: "100%",
      paddingTop: 0
    }
  }, 
  flags: {
    width: 380
  },
  collapsedPosts: {
    // width: 630,
    padding: 8
  },
  collapsedFlags: {
    // width: 630,
    padding: 8
  },
  tagName: {
    maxWidth: 270,
    textOverflow: "ellipsis",
    overflow: "hidden",
    fontSize: "1.2rem",
    whiteSpace: "nowrap"
  },
  likeButton: {
    width: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  voteElements: {
    padding: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }
});

const TagsDetailsItem = ({tag, classes, showFlags = false, flagId, collapse = false }: {
  tag: TagFragment | TagWithFlagsFragment,
  classes: ClassesType<typeof styles>,
  showFlags?: boolean,
  flagId?: string,
  collapse?: boolean
}) => {
  const { LinkCard, TagPreviewDescription, TagSmallPostLink, Loading, TagFlagItem, TagsTooltip, LWTooltip, TagOrLensLikeButton, ReactionsAndLikesVote } = Components;
  const currentUser = useCurrentUser();
  const [ editing, setEditing ] = useState(false)
  const { query } = useLocation();

  const { results: tagRels, loading } = useMulti({
    skip: !(tag._id) || showFlags,
    terms: {
      view: "postsWithTag",
      tagId: tag._id,
    },
    collectionName: "TagRels",
    fragmentName: "TagRelFragment",
    limit: 20,
  });

  const votingSystem = getVotingSystemByName("reactionsAndLikes");

  return <div className={classes.root}>
    <div className={classes.voteElements}>
    {tag.baseScore}
    <ReactionsAndLikesVote
        document={tag}
        collectionName="Tags"
        votingSystem={votingSystem}
        isSelected={true}
        stylingVariant="default"
        className={classes.likeButton}
      />
    </div>
    <div className={classNames(classes.description, {[classes.collapsedDescription]: collapse})}>
      {editing ? 
        <EditTagForm 
          tag={tag} 
          successCallback={()=>setEditing(false)} 
          cancelCallback={()=>setEditing(false)}
        />
        : <div>
        <TagsTooltip tagSlug={tag.slug} noPrefetch previewPostCount={0} placement='bottom-start' >
        <Link to={tagGetUrl(tag, {flagId, edit: !!currentUser})} >
          <div className={classes.tagName}>
            <strong>{tag.name}</strong>
            </div>
          </Link>
        </TagsTooltip>
        <TagPreviewDescription tag={tag} />
        </div>
      }
      {/* {currentUser && !collapse && 
        <div>
          <a onClick={() => setEditing(true)} className={classes.edit}>
            Edit
          </a>
        </div>
      } */}
    </div>
    {!showFlags && <div className={classNames(classes.posts, {[classes.collapsedPosts]: collapse})}>
      <div>
        <LWTooltip 
        title={<div>
            {tagRels?.map(tagRel=><div key={tagRel._id}>[{tagRel.post?.baseScore}] {tagRel.post?.title}</div>)}
          </div>}
        >
          <Link to={tagGetUrl(tag)} className={classes.postCount}>
            {tag.postCount} posts tagged <em>{tag.name}</em>
          </Link>
        </LWTooltip>
        {/* {!tagRels && loading && <Loading/>}
        {tagRels && tagRels.map(tagRel=>
          (tagRel.post && <TagSmallPostLink key={tagRel._id} post={tagRel.post} hideMeta wrap/>)
        )} */}
      </div>
    </div>}
    {showFlags && <div className={classNames(classes.posts, classes.flags, {[classes.collapsedFlags]: collapse})}>
      {(tag as TagWithFlagsFragment)?.tagFlags?.filter(tagFlag => !tagFlag.deleted).map(tagFlag => <span key={tagFlag._id}>
        <QueryLink query={query.focus === tagFlag?._id ? {} : {focus: tagFlag?._id}}>
          <TagFlagItem 
            documentId={tagFlag._id} 
            showNumber={false} 
            style={query.focus===tagFlag?._id ? "black" : "grey"}
          />
        </QueryLink>
      </span>)}
    </div>}
  </div>
}

const TagsDetailsItemComponent = registerComponent("TagsDetailsItem", TagsDetailsItem, {styles});

declare global {
  interface ComponentTypes {
    TagsDetailsItem: typeof TagsDetailsItemComponent
  }
}
