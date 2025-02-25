import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { Link, QueryLink } from '../../lib/reactRouterWrapper';
import { useCurrentUser } from '../common/withUser';
import { EditTagForm } from './EditTagPage';
import { useMulti } from '../../lib/crud/withMulti';
import { useLocation } from '../../lib/routeUtil';
import classNames from 'classnames'

const styles = (theme: ThemeType) => ({
  root: {
    background: theme.palette.panelBackground.default,
    ...theme.typography.commentStyle,
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    borderBottom: theme.palette.border.faint,
  },
  description: {
    maxWidth: 580,
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
    width: 410,
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
    width: 630,
    padding: 8
  },
  collapsedFlags: {
    width: 630,
    padding: 8
  },
  tagName: {
    maxWidth: 270,
    textOverflow: "ellipsis",
    overflow: "hidden",
    fontSize: "1.2rem",
    whiteSpace: "nowrap"
  }
});

const TagsDetailsItem = ({tag, classes, showFlags = false, flagId, collapse = false }: {
  tag: TagFragment | TagWithFlagsFragment,
  classes: ClassesType<typeof styles>,
  showFlags?: boolean,
  flagId?: string,
  collapse?: boolean
}) => {
  const { LinkCard, TagPreviewDescription, TagSmallPostLink, Loading, TagFlagItem } = Components;
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
    limit: 3,
  });

  return <div className={classes.root}>
    <div className={classNames(classes.description, {[classes.collapsedDescription]: collapse})}>
      {editing ? 
        <EditTagForm 
          tag={tag} 
          successCallback={()=>setEditing(false)} 
          cancelCallback={()=>setEditing(false)}
        />
        :
        <LinkCard 
          to={tagGetUrl(tag, {flagId, edit: !!currentUser})} 
        >
          {collapse ? <div className={classes.tagName}>
            <strong>{tag.name}</strong>
          </div> : <TagPreviewDescription tag={tag} />}
        </LinkCard>
      }
      {currentUser && !collapse && 
        <div>
          <a onClick={() => setEditing(true)} className={classes.edit}>
            Edit
          </a>
        </div>
      }
    </div>
    {!showFlags && <div className={classNames(classes.posts, {[classes.collapsedPosts]: collapse})}>
      <div>
        <Link to={tagGetUrl(tag)} className={classes.postCount}>
          {tag.postCount} posts tagged <em>{tag.name}</em>
        </Link>
        {!tagRels && loading && <Loading/>}
        {tagRels && tagRels.map(tagRel=>
          (tagRel.post && <TagSmallPostLink key={tagRel._id} post={tagRel.post} hideMeta wrap/>)
        )}
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
