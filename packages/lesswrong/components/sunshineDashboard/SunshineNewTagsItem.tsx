import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useUpdate } from '../../lib/crud/withUpdate';
import { Tags } from '../../lib/collections/tags/collection';
import Users from '../../lib/collections/users/collection';
import { Link } from '../../lib/reactRouterWrapper'
import { useCurrentUser } from '../common/withUser';
import { useHover } from '../common/withHover'
import DoneIcon from '@material-ui/icons/Done';
import ClearIcon from '@material-ui/icons/Clear';
import withErrorBoundary from '../common/withErrorBoundary'
import { commentBodyStyles, } from '../../themes/stylePiping'
import { useMulti } from '../../lib/crud/withMulti';
import { TagRels } from '../../lib/collections/tagRels/collection';

const styles = (theme: ThemeType): JssStyles => ({
  tagInfo: {
    ...commentBodyStyles(theme),
    marginTop: 0,
    marginBottom: 0
  },
  postCount: {
    ...theme.typography.commentStyle,
    ...theme.typography.smallText,
    marginTop: 12,
    marginBottom: 8,
    color: theme.palette.grey[600]
  },
  post: {
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    marginBottom: 4,
    color: theme.palette.grey[700]
  }
})

const SunshineNewTagsItem = ({tag, classes}: {
  tag: SunshineTagFragment,
  classes: ClassesType
}) => {
  const currentUser = useCurrentUser();
  const {eventHandlers, hover, anchorEl} = useHover();
  
  const {mutate: updateTag} = useUpdate({
    collection: Tags,
    fragmentName: 'SunshineTagFragment',
  });

  const handleApprove = () => {
    if (!currentUser) return null
    void updateTag({
      selector: { _id: tag._id},
      data: {
        reviewedByUserId: currentUser._id,
        needsReview: false
      },
    })
  }

  const handleDelete = () => {
    if (!currentUser) return null
    void updateTag({
      selector: { _id: tag._id},
      data: {
        reviewedByUserId: currentUser._id,
        needsReview: false,
        deleted: true
      },
    })
  }

  const { SidebarActionMenu, TagSmallPostLink, SidebarAction, ContentItemBody, SunshineListItem, SidebarHoverOver, SidebarInfo, Loading } = Components

  const { results, loading } = useMulti({
    skip: !(tag._id),
    terms: {
      view: "postsWithTag",
      tagId: tag._id,
    },
    collection: TagRels,
    fragmentName: "TagRelFragment",
    limit: 20,
  });
  
  return (
    <span {...eventHandlers}>
      <SunshineListItem hover={hover}>
        <SidebarHoverOver hover={hover} anchorEl={anchorEl}>
          <div className={classes.tagInfo}>
            <Link to={Tags.getUrl(tag)}>
              <b>{tag.name}</b>
            </Link>
            <ContentItemBody dangerouslySetInnerHTML={{__html: tag.description?.html || ""}} description={`tag ${tag._id}`}/>
          </div>
          <div className={classes.postCount}>
            {tag.postCount} posts
          </div>
          {results && results.map(tagRel=><div key={tagRel._id} className={classes.post}>
            <TagSmallPostLink post={tagRel.post}/>
          </div>)}
          {!results && loading && <Loading/>}
        </SidebarHoverOver>
        <Link to={Tags.getUrl(tag)}>
          {tag.name}
        </Link>
        <div>
          <SidebarInfo>
            <Link to={Users.getProfileUrl(tag.user)}>
              {tag.user && tag.user.displayName}
            </Link>
          </SidebarInfo>
        </div>
        { hover && <SidebarActionMenu>
          {/* to fully approve a user, they most have created a post or comment. Users that have only voted can only be snoozed */}
          <SidebarAction title="Approve" onClick={handleApprove}>
            <DoneIcon />
          </SidebarAction>
          <SidebarAction title="Delete" onClick={handleDelete}>
            <ClearIcon />
          </SidebarAction>
        </SidebarActionMenu>}
      </SunshineListItem>
    </span>
  )
}

const SunshineNewTagsItemComponent = registerComponent('SunshineNewTagsItem', SunshineNewTagsItem, {styles, 
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    SunshineNewTagsItem: typeof SunshineNewTagsItemComponent
  }
}
