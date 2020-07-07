import React, { useState } from 'react';
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

const styles = theme => ({

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
    updateTag({
      selector: { _id: tag._id},
      data: {
        reviewedByUserId: currentUser!._id,
        needsReview: false
      },
    })
  }

  const handleDelete = () => {
    updateTag({
      selector: { _id: tag._id},
      data: {
        reviewedByUserId: currentUser!._id,
        needsReview: false,
        deleted: true
      },
    })
  }

  const { SidebarActionMenu, SidebarAction, ContentItemBody, SunshineListItem, SidebarHoverOver, SidebarInfo, CoreTagsChecklist, FooterTagList } = Components


  return (
    <span {...eventHandlers}>
      <SunshineListItem hover={hover}>
        <SidebarHoverOver hover={hover} anchorEl={anchorEl}>
          <Link to={Tags.getUrl(tag)}>
            {tag.name}
          </Link>
          <ContentItemBody dangerouslySetInnerHTML={{__html: tag.description?.html}} description={`tag ${tag._id}`}/>
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
