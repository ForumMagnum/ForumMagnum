import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useUpdate } from '../../lib/crud/withUpdate';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { userGetProfileUrl } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper'
import { useCurrentUser } from '../common/withUser';
import { useHover } from '../common/withHover'
import DoneIcon from '@/lib/vendor/@material-ui/icons/src/Done';
import ClearIcon from '@/lib/vendor/@material-ui/icons/src/Clear';
import withErrorBoundary from '../common/withErrorBoundary'
import { useMulti } from '../../lib/crud/withMulti';
import SidebarActionMenu from "./SidebarActionMenu";
import TagSmallPostLink from "../tagging/TagSmallPostLink";
import SidebarAction from "./SidebarAction";
import { ContentItemBody } from "../contents/ContentItemBody";
import SunshineListItem from "./SunshineListItem";
import SidebarHoverOver from "./SidebarHoverOver";
import SidebarInfo from "./SidebarInfo";
import Loading from "../vulcan-core/Loading";
import ContentStyles from "../common/ContentStyles";

const styles = (theme: ThemeType) => ({
  tagInfo: {
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
  classes: ClassesType<typeof styles>
}) => {
  const currentUser = useCurrentUser();
  const {eventHandlers, hover, anchorEl} = useHover();
  
  const {mutate: updateTag} = useUpdate({
    collectionName: "Tags",
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
  const { results, loading } = useMulti({
    skip: !(tag._id),
    terms: {
      view: "postsWithTag",
      tagId: tag._id,
    },
    collectionName: "TagRels",
    fragmentName: "TagRelFragment",
    limit: 20,
  });
  
  return (
    <span {...eventHandlers}>
      <SunshineListItem hover={hover}>
        <SidebarHoverOver hover={hover} anchorEl={anchorEl}>
          <ContentStyles contentType="comment" className={classes.tagInfo}>
            <Link to={tagGetUrl(tag)}>
              <b>{tag.name}</b>
            </Link>
            <ContentItemBody dangerouslySetInnerHTML={{__html: tag.description?.html || ""}} description={`tag ${tag._id}`}/>
          </ContentStyles>
          <div className={classes.postCount}>
            {tag.postCount} posts
          </div>
          {results && results.map(tagRel=><div key={tagRel._id} className={classes.post}>
            {tagRel.post && <TagSmallPostLink post={tagRel.post}/>}
          </div>)}
          {!results && loading && <Loading/>}
        </SidebarHoverOver>
        <Link to={tagGetUrl(tag)}>
          {tag.name}
        </Link>
        <div>
          <SidebarInfo>
            {tag.postCount}
          </SidebarInfo>
          <SidebarInfo>
            <Link to={userGetProfileUrl(tag.user)}>
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

export default registerComponent('SunshineNewTagsItem', SunshineNewTagsItem, {styles, 
  hocs: [withErrorBoundary]
});


