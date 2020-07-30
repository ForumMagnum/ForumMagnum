import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Tags } from '../../lib/collections/tags/collection';
import { Link } from '../../lib/reactRouterWrapper';
import { useCurrentUser } from '../common/withUser';
import { userCanManageTags } from '../../lib/betas';
import { EditTagForm } from './EditTagPage';
import { useMulti } from '../../lib/crud/withMulti';
import { TagRels } from '../../lib/collections/tagRels/collection';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    background: "white",
    ...theme.typography.commentStyle,
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    borderBottom: "solid 1px rgba(0,0,0,.1)"
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
  }
});

const TagsDetailsItem = ({tag, classes }: {
  tag: TagPreviewFragment,
  classes: ClassesType,
}) => {
  const { LinkCard, TagPreviewDescription, TagSmallPostLink, Loading } = Components;
  const currentUser = useCurrentUser();
  const [ editing, setEditing ] = useState(false)

  const { results: tagRels, loading } = useMulti({
    skip: !(tag._id),
    terms: {
      view: "postsWithTag",
      tagId: tag._id,
    },
    collection: TagRels,
    fragmentName: "TagRelFragment",
    limit: 3,
  });

  return <div className={classes.root}>
    <div className={classes.description}>
      {editing ? 
        <EditTagForm tag={tag} successCallback={()=>setEditing(false)}/>
        :
        <LinkCard to={Tags.getUrl(tag)}>
          <TagPreviewDescription tag={tag} />
        </LinkCard>
      }
      {userCanManageTags(currentUser) && 
      <a onClick={() => setEditing(true)} className={classes.edit}>
        Edit
      </a>}
    </div>
    <div className={classes.posts}>
      <div>
        <Link to={Tags.getUrl(tag)} className={classes.postCount}>
          {tag.postCount} posts tagged <em>{tag.name}</em>
        </Link>
        {!tagRels && loading && <Loading/>}
        {tagRels && tagRels.map(tagRel=>
          <TagSmallPostLink key={tagRel._id} post={tagRel.post} hideMeta wrap/>
        )}
      </div>
    </div>
  </div>
}

const TagsDetailsItemComponent = registerComponent("TagsDetailsItem", TagsDetailsItem, {styles});

declare global {
  interface ComponentTypes {
    TagsDetailsItem: typeof TagsDetailsItemComponent
  }
}
