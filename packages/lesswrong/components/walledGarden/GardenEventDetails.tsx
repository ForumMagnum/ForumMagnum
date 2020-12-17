import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Typography from "@material-ui/core/Typography";
import { FacebookIcon } from "../localGroups/GroupLinks";
import LinkIcon from "@material-ui/icons/Link";
import { useMessages } from "../common/withMessages";
import moment from "../../lib/moment-timezone";
import {useTimezone} from "../common/withTimezone";

const iconStyling = {
  marginLeft: 1,
  height: 20,
  width: 20,
  cursor: "pointer",
  position: "relative",
  top: 1,
  '&:hover': {
    opacity: 0.5
  }
}

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    padding: 30,
    background: "white"
  },
  title: {
    ...theme.typography.display3,
    marginTop: 0,
    fontWeight: 600,
    cursor: "pointer",
    '&:hover': {
      opacity: 1
    }
  },
  startTime: {
    color: theme.palette.grey[700],
    fontVariant: "small-caps",
    fontSize: "1.6rem",
    marginBottom: 30
  }
})

export const GardenEventDetails = ({gardenCode, classes}: {gardenCode: GardenCodeFragment, classes:ClassesType}) => {
  
  const { timezone } = useTimezone();
  
  const { flash } = useMessages();
  const { ContentItemBody, LWTooltip } = Components
  const inviteLink = `http://garden.lesswrong.com?code=${gardenCode.code}&event=${gardenCode.slug}`
  
  return <div className={classes.root}>
      <LWTooltip title="Click to copy invite link" placement="right">
        <CopyToClipboard text={inviteLink} onCopy={()=>flash({messageString:"Invite link copied!"})}>
          <Typography variant="display3" className={classes.title}>
            {gardenCode.title}
          </Typography>
        </CopyToClipboard>
      </LWTooltip>
    <div className={classes.startTime}>
      <div>{moment(gardenCode?.startTime).tz(timezone).format("dddd, MMMM Do, YYYY")}</div>
      <div>{moment(gardenCode?.startTime).tz(timezone).format("h:mma z")}</div>
    </div>
    <ContentItemBody
      dangerouslySetInnerHTML={{__html: gardenCode.contents?.html||""}}
      description={`gardenCode ${gardenCode.code}`}
      className={classes.description}
    />
  </div>
}

const GardenEventDetailsComponent = registerComponent('GardenEventDetails', GardenEventDetails, {styles});

declare global {
  interface ComponentTypes {
    GardenEventDetails: typeof GardenEventDetailsComponent
  }
}
