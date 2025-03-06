import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useMessages } from "../common/withMessages";
import { makeLinkAbsolute } from "./GardenCodesItem";
import ContentItemBody from "@/components/common/ContentItemBody";
import LWTooltip from "@/components/common/LWTooltip";
import { Typography } from "@/components/common/Typography";
import FormatDate from "@/components/common/FormatDate";

const styles = (theme: ThemeType) => ({
  root: {
    padding: 30,
    background: theme.palette.panelBackground.default,
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
    ...theme.typography.smallCaps,
    fontSize: "1.6rem",
    marginBottom: 30
  },
  description: {
    marginBottom: 20
  }
})

export const GardenEventDetails = ({gardenCode, classes}: {gardenCode: GardenCodeFragment, classes: ClassesType<typeof styles>}) => {
  const { flash } = useMessages();
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
      <div><FormatDate date={gardenCode.startTime} format={"dddd, MMMM Do, YYYY"} /></div>
      <div><FormatDate date={gardenCode.startTime} format={"h:mma z"} /></div>
    </div>
    <ContentItemBody
      dangerouslySetInnerHTML={{__html: gardenCode.contents?.html||""}}
      description={`gardenCode ${gardenCode.code}`}
      className={classes.description}
    />
    {gardenCode.fbLink  && <LWTooltip title="Link to the FB version of this event" placement="right">
      <a href={makeLinkAbsolute(gardenCode.fbLink)} target="_blank" rel="noopener noreferrer">
        <em>Facebook Event</em>
      </a>
    </LWTooltip>}
  </div>
}

const GardenEventDetailsComponent = registerComponent('GardenEventDetails', GardenEventDetails, {styles});

declare global {
  interface ComponentTypes {
    GardenEventDetails: typeof GardenEventDetailsComponent
  }
}

export default GardenEventDetailsComponent;
