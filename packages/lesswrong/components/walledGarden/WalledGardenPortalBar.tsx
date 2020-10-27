import React, { useState } from 'react';
import { registerComponent, Components, getFragment } from '../../lib/vulcan-lib';
import { GardenCodes } from "../../lib/collections/gardencodes/collection";
import {Button, TextField} from "@material-ui/core";
import { CopyToClipboard } from 'react-copy-to-clipboard';
import {postBodyStyles} from "../../themes/stylePiping";
import {useTracking} from "../../lib/analyticsEvents";
import { ExpandedDate } from "../common/FormatDate";
import { useUpdate } from '../../lib/crud/withUpdate';
import Users from "../../lib/vulcan-users";
import { useCurrentUser } from '../common/withUser';

const styles = (theme) => ({
  messageStyling: {
    ...postBodyStyles(theme)
  },
  portalBarButton: {
    position: "absolute",
    left: "50%",
  },
  gardenCodeWidget: {
    width: "450px",
    marginLeft: "30px",
    marginTop: "20px"
    // marginRight: "20px"

  }
})

export const WalledGardenPortalBar = ({classes}:{classes:ClassesType}) => {
  const { GardenCodeWidget } = Components

  const currentUser =  useCurrentUser()
  const { mutate: updateUser } = useUpdate({
    collection: Users,
    fragmentName: 'UsersCurrent',
  })

  const { captureEvent } = useTracking()

  const [hideBar, setHideBar] = useState(currentUser?.hideWalledGardenPortalBar||false)


  if (!currentUser) return null

  return <div>
    <Button className={classes.portalBarButton} onClick={ async () => {
      setHideBar(!hideBar);
      void updateUser({
        selector: { _id: currentUser._id },
        data: {
          hideWalledGardenPortalBar: !hideBar
        },
      })
    }}>
      <strong>{hideBar ? "Show" : "Hide"} Bar</strong>
    </Button>

    {!hideBar && <div>
      <div className={classes.gardenCodeWidget}>
        <GardenCodeWidget/>
      </div>
      {/*//eventCalendar*/}
      {/*<iframe src={"https://cuckoo.team/lesswrong"}></iframe>*/}
    </div>
    }
  </div>
}

const WalledGardenPortalBarComponent = registerComponent('WalledGardenPortalBar', WalledGardenPortalBar, {styles});

declare global {
  interface ComponentTypes {
    WalledGardenPortalBar: typeof WalledGardenPortalBarComponent
  }
}

