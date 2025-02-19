import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import CreateIcon from '@material-ui/icons/Create';
import { eventRoot, eventName, eventTime, eventFormat } from "./PortalBarGcalEventItem";
import { highlightSimplifiedStyles } from '../posts/PostsPreviewTooltip/LWPostsPreviewTooltip';
import { userOwns, userCanDo } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import PersonIcon from '@material-ui/icons/Person';
import LinkIcon from '@material-ui/icons/Link';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import {useMessages} from "../common/withMessages";
import { FacebookIcon } from "../localGroups/GroupLinks";
import { truncate } from '../../lib/editor/ellipsize';

const iconStyling = {
  marginLeft: 2,
  height: 16,
  width: 16,
  cursor: "pointer",
  position: "relative",
  top: 1,
  '&:hover': {
    opacity: 1
  }
}

const styles = (theme: ThemeType) => ({
  root: {
    ...eventRoot(theme),
    width: 420,
  },
  highlight: {
    ...highlightSimplifiedStyles
  },
  eventName: {
    ...eventName(theme)
  },
  eventNameLink: {
    color: `${theme.palette.text.dim55} !important`,
  },
  eventTime: {
    ...eventTime(theme)
  },
  personalIcon: {
    ...iconStyling,
    marginLeft: 0,
    marginRight: 3,
    opacity: .75,
  },
  trailingIcons: {
    color: theme.palette.icon.dim700,
    width: 48,
    marginLeft: 8,
    display: "flex",
    justifyContent: "flex-start"
  },
  linkIcon: {
    ...iconStyling,
    marginLeft: 0,
    opacity: .5,
    transform: 'rotate(-45deg)',
  },
  fbIconContainer: {
    ...iconStyling,
  },
  fbIcon: {
    color: theme.palette.icon.dim700,
    height: 12,
    width: 12,
    opacity: .5,
    marginBottom: 1
  },
  editIcon: {
    ...iconStyling,
    opacity: .35,
  },
})


export const makeLinkAbsolute = (link: string) => {return link.startsWith('http://') || link.startsWith('https://') ? link : `https://${link}`}

export const GardenCodesItem = ({classes, gardenCode}: {
  classes: ClassesType<typeof styles>,
  gardenCode: GardenCodeFragment
}) => {
  const { GardenCodesEditForm, LWTooltip, ContentItemBody } = Components
  const currentUser = useCurrentUser();
  const [editing, setEditing] = useState(false)
  const { flash } = useMessages();
  if (editing) {
    return <GardenCodesEditForm gardenCodeId={gardenCode._id} cancelCallback={()=> setEditing(false)}   />
  }
  const inviteLink = `http://garden.lesswrong.com?code=${gardenCode.code}&event=${gardenCode.slug}`
  
  return <div className={classes.root}>
    <span className={classes.eventName}>
      {gardenCode.type==='private' && <LWTooltip title="Your personal event" placement="right">
        <PersonIcon className={classes.personalIcon}/>
      </LWTooltip>}
      {gardenCode.contents?.htmlHighlight ? <span><LWTooltip title={<span className={classes.highlight}>
          <ContentItemBody
            dangerouslySetInnerHTML={{__html: truncate(gardenCode.contents.htmlHighlight, 1000, "characters", "...(click to open event page)") }}
            description={`garden-code-${gardenCode._id}`}
          />
        </span>}>
          <a className={classes.eventNameLink} href={inviteLink} target="_blank" rel="noopener noreferrer">
            {gardenCode.title}
          </a>
        </LWTooltip>
      </span>
        : <a className={classes.eventNameLink} href={inviteLink} target="_blank" rel="noopener noreferrer">
          {gardenCode.title}
        </a>
        }
        </span>
    <div className={classes.eventTime}>
      {eventFormat(gardenCode.startTime)}
    </div>
    <div className={classes.trailingIcons}>
      <LWTooltip title="Click to copy invite link" placement="right">
        <CopyToClipboard text={inviteLink} onCopy={()=>flash({messageString:"Invite link copied!"})}>
          <LinkIcon className={classes.linkIcon}/>
        </CopyToClipboard>
      </LWTooltip>
      <div className={classes.fbIconContainer}> {/*container for fb icon to maintain spacing*/} 
        {gardenCode.fbLink && (gardenCode.type==="public" || currentUser?.walledGardenInvite) &&
        <LWTooltip title="Link to the FB version of this event" placement="right">
          <a href={makeLinkAbsolute(gardenCode.fbLink)} target="_blank" rel="noopener noreferrer">
            <FacebookIcon className={classes.fbIcon}/>
          </a>
        </LWTooltip>}
      </div>
      {(userCanDo(currentUser, "gardencodes.edit.all") || userOwns(currentUser, gardenCode)) &&
      <LWTooltip title="Click to edit event invite" placement="right">
        <CreateIcon className={classes.editIcon} onClick={() => setEditing(true)}/>
      </LWTooltip>}
    </div>
  </div>
}

const GardenCodesItemComponent = registerComponent('GardenCodesItem', GardenCodesItem, {styles});

declare global {
  interface ComponentTypes {
    GardenCodesItem: typeof GardenCodesItemComponent
  }
}
