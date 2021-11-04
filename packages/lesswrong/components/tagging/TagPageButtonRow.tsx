// TODO; rename file
import MenuItem from '@material-ui/core/MenuItem';
import Popover from '@material-ui/core/Popover';
import EditOutlinedIcon from '@material-ui/icons/EditOutlined';
import EditIcon from '@material-ui/icons/Edit';
import HistoryIcon from '@material-ui/icons/History';
import React, { useState } from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useDialog } from '../common/withDialog';
import { useCurrentUser } from '../common/withUser';
import { useTagBySlug } from './useTag';
import { userHasNewTagSubscriptions } from '../../lib/betas';
import { subscriptionTypes } from '../../lib/collections/subscriptions/schema';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  smallPencilIcon: {
    fontSize: 18
  },
  helpImproveButton: {
    ...theme.typography.body2,
    color: theme.palette.grey[700],
    marginTop: 4,
    display: "flex",
    fontStyle: 'italic',
  },
  button: {
    display: "flex",
    alignItems: "center",
    marginRight: 16,
    ...theme.typography.body2,
    color: theme.palette.grey[700],
    "& svg": {
      fontSize: 22,
      marginRight: 6,
    }
  },
  buttonIcon: {
    marginRight: 4,
  },
  editMenuItem: {
    marginTop: 4,
  },
  ctaPositioning: {
    display: "flex",
    alignItems: "center",
    marginLeft: "auto"
  },
  callToAction: {
    display: "flex",
    alignItems: "center",
    marginLeft: "auto",
    fontStyle: 'italic',
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  },
  callToActionFlagCount: {
    position: "relative",
    marginLeft: 4,
    marginRight: 0
  },
  tagFlags: {
    marginLeft: 16,
    marginTop: 16,
    [theme.breakpoints.down('sm')]: {
      marginRight: 16,
      marginBottom: 24,
    },
  },
  beginnersGuide: {
    ...theme.typography.body2,
    width: 500,
    marginTop: 16,
    marginLeft: 16,
    marginRight: 16,
    marginBottom: 24,
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  },
  subscribeToWrapper: {
    display: 'inline-block',
    width: '100%',
  }
});

const TagPageButtonRow = ({tag, editing, setEditing, className, classes}: {
  tag: TagPageWithRevisionFragment|TagPageFragment,
  editing: boolean,
  className?: string,
  setEditing: (editing: boolean)=>void,
  classes: ClassesType
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const { openDialog } = useDialog();
  const currentUser = useCurrentUser();
  // TODO; we can avoid a database round trip on every tag page load by
  // conditionally fetching this
  const { tag: beginnersGuideContentTag } = useTagBySlug("tag-cta-popup", "TagFragment")
  const { TagDiscussionButton, ContentItemBody, LWTooltip, NotifyMeButton, Typography, TagFlagItem } = Components;
  
  const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
    setAnchorEl(event.currentTarget);
    event.preventDefault();
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleClickEdit: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
    if (currentUser) {
      setEditing(true)
    } else {
      openDialog({
        componentName: "LoginPopup",
        componentProps: {}
      });
    }
    handleClose()
    event.preventDefault();
  }
  
  const numFlags = tag.tagFlagsIds?.length
  
  return <div className={className}>
    <Popover
      open={!!anchorEl}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
    >
      {!editing && <MenuItem onClick={handleClickEdit} className={classes.editMenuItem}>
        <span className={classes.button}>
          <EditOutlinedIcon className={classes.buttonIcon} /> Edit
        </span>
      </MenuItem>}
      <Link to={`/tag/${tag.slug}/history`}>
        <MenuItem>
          <span className={classes.button}>
            <HistoryIcon className={classes.buttonIcon} /> History
          </span>
        </MenuItem>
      </Link>
      {
        !userHasNewTagSubscriptions(currentUser) && 
        !tag.wikiOnly && 
        !editing && 
        <LWTooltip title="Get notifications when posts are added to this tag." className={classes.subscribeToWrapper}>
          <MenuItem>
            <NotifyMeButton
              document={tag}
              className={classNames(classes.subscribeTo, classes.button)}
              showIcon
              hideLabelOnMobile
              subscribeMessage="Notify me of new posts"
              unsubscribeMessage="Stop notifying me of new posts"
              subscriptionType={subscriptionTypes.newTagPosts}
            />
          </MenuItem>
        </LWTooltip>
      }
      <MenuItem>
        <div className={classes.button}>
          <TagDiscussionButton tag={tag} />
        </div>
      </MenuItem>
      {tag.tagFlags.length > 0 && <div className={classes.tagFlags}>
        <Typography variant="body2" gutterBottom>
          <em>This article has the following flags:</em>
        </Typography>
        {tag.tagFlags.map(flag => <TagFlagItem
          key={flag._id}
          documentId={flag._id}
          style={"grey"}
          showNumber={false}
        />)}
      </div>}
      <ContentItemBody
        className={classes.beginnersGuide}
        dangerouslySetInnerHTML={{__html: beginnersGuideContentTag?.description?.html || ""}}
        description={`tag ${tag?.name}`}
      />
    </Popover>
    
    <a className={classes.helpImproveButton} onClick={handleClick}>
      <EditIcon className={classes.smallPencilIcon}/> Help improve this page{' '}
      <span className={classes.callToActionFlagCount}>
        {!!numFlags&&`(${numFlags} flag${numFlags > 1 ? 's' : ''})`}
      </span>
    </a>
  </div>
}

const TagPageButtonRowComponent = registerComponent("TagPageButtonRow", TagPageButtonRow, {styles});

declare global {
  interface ComponentTypes {
    TagPageButtonRow: typeof TagPageButtonRowComponent
  }
}
