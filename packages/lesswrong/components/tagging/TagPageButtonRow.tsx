// TODO; rename file
import MenuItem from '@material-ui/core/MenuItem';
import Popover from '@material-ui/core/Popover';
import EditOutlinedIcon from '@material-ui/icons/EditOutlined';
import HistoryIcon from '@material-ui/icons/History';
import classNames from 'classnames';
import React, { useState } from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useDialog } from '../common/withDialog';
import { useCurrentUser } from '../common/withUser';
import { useTagBySlug } from './useTag';

const styles = (theme: ThemeType): JssStyles => ({
  helpImproveButton: {
    ...theme.typography.body2,
    color: theme.palette.grey[700],
    marginTop: 4,
    display: "flex",
    fontStyle: 'italic',
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  },
  button: {
    display: "flex",
    alignItems: "center",
    marginRight: 16
  },
  editMenuItem: {
    marginTop: 4,
  },
  buttonLabel: {
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  },
  disabledButton: {
    '&&': {
      color: theme.palette.grey[500],
      cursor: "default",
      marginBottom: 12
    }
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
  beginnersGuide: {
    ...theme.typography.body2,
    width: 600,
    marginTop: 16,
    marginLeft: 16,
    marginRight: 16,
    marginBottom: 24,
  },
});

const TagPageButtonRow = ({tag, editing, setEditing, classes}: {
  tag: TagPageWithRevisionFragment|TagPageFragment,
  editing: boolean,
  setEditing: (editing: boolean)=>void,
  classes: ClassesType
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const { openDialog } = useDialog();
  const currentUser = useCurrentUser();
  // TODO; we can avoid a database round trip on every tag page load by
  // conditionally fetching this
  const { tag: beginnersGuideContentTag } = useTagBySlug("tag-cta-popup", "TagFragment")
  const { LWTooltip, TagDiscussionButton, ContentItemBody, Typography } = Components;
  
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
  
  return <div>
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
        {/* TODO; extract onclick handler */}
        <span className={classNames(classes.button, classes.editButton)}>
          <EditOutlinedIcon /><span className={classes.buttonLabel}>Edit</span>
        </span>
      </MenuItem>}
      <MenuItem>
        <Link className={classes.button} to={`/tag/${tag.slug}/history`}>
          <HistoryIcon /><span className={classes.buttonLabel}>History</span>
        </Link>
      </MenuItem>
      <MenuItem>
        <div className={classes.button}>
          <TagDiscussionButton tag={tag} hideLabelOnMobile />
        </div>
      </MenuItem>
      <ContentItemBody
        className={classes.beginnersGuide}
        dangerouslySetInnerHTML={{__html: beginnersGuideContentTag?.description?.html || ""}}
        description={`tag ${tag?.name}`}
      />
    </Popover>
    
    <LWTooltip
      // TODO; move this to the popover
      title={ tag.tagFlagsIds?.length > 0 ? 
        <div>
          {tag.tagFlags.map((flag, i) => <span key={flag._id}>{flag.name}{(i+1) < tag.tagFlags?.length && ", "}</span>)}
        </div> :
        <span>
          This tag does not currently have any improvement flags set.
        </span>
      }
      >
      <a className={classes.helpImproveButton} onClick={handleClick}>
        Help improve this page{' '}
        <span className={classes.callToActionFlagCount}>
          {!!numFlags&&`(${numFlags} flags)`}
        </span>
      </a>
    </LWTooltip>
  </div>
}

const TagPageButtonRowComponent = registerComponent("TagPageButtonRow", TagPageButtonRow, {styles});

declare global {
  interface ComponentTypes {
    TagPageButtonRow: typeof TagPageButtonRowComponent
  }
}
