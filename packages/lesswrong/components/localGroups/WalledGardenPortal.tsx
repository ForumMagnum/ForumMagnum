import { Typography } from '@material-ui/core';
import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { postBodyStyles } from '../../themes/stylePiping';
import { useCurrentUser } from '../common/withUser';
import { useLocation } from "../../lib/routeUtil";

const styles = (theme) => ({
  body: {
    ...theme.typography.body1,
    ...postBodyStyles(theme)
  },
  iframeStyling: {
    width: "100%",
    height: 800,
    border: "none",
    // maxWidth: "100vw"
  }
})

/* TO DO LIST
* - link parsing for shared links
* - query whether host is in Garden
* - Sidebar: office-hours, create new event, add calendar to own, share invite-link
*
* Flows:
* 1) full member -> page renders normally
* 2) garden set to open (for weekend): fully open message and renders for all
* 3) has link: a) event link, event currently running ? render : "sorry, event is over"
* b) event is personal code, host in garden? render : "sorry, host is not in the garden"
*
* */


function validateInviteCode(code: string) {
  return (code.length > 3)
}

const WalledGardenPortal = ({classes}:{classes:ClassesType}) => {
  const { query, params: { slug } } = useLocation();
  const { inviteCode: inviteCodeQuery } = query;
  const currentUser = useCurrentUser();

  const isSunday =  (new Date()).getDay() === 0;
  const authorizedToEnter = (currentUser && currentUser.walledGardenInvite) || (inviteCodeQuery && validateInviteCode(inviteCodeQuery)) || isSunday ;

  const [onboarded, setOnboarded] = useState(false);
  const hasInvite = currentUser?.walledGardenInvite;

  console.log({isSunday, inviteCodeQuery, authorizedToEnter, hasInvite});

  if (!authorizedToEnter) {
    return <div>The Walled Garden is a private virtual space managed by the LessWrong team. It is closed right now.
      Please return on Sunday when it is open to everyone. If you have a non-Sunday invite, you may need to log
      in.</div>
  } else {
    return <div>
      {onboarded
        ? (<iframe className={classes.iframeStyling} src="https://gather.town/app/aPVfK3G76UukgiHx/lesswrong-campus"></iframe>)
        : (<div>
            <p>Welcome! The Garden is a locus for truthseeking.&nbsp;<br></br>
              Get curious, go wherever the evidence takes you, be precise with your words, conduct experiments,
              make bets, plan for your own fallibility, study many sciences and absorb their powers as your own.
              Blah, blah, blah, this text is bad. Make better text!!<br></br>And, above, all in every motion,
              figure out what is really actually true.</p>
            < ul>
              <li>Headphones</li>
              <li>Interactions are voluntary</li>
              <li>Restart to fix problems</li>
              <li>Respawn</li>
            </ul>
            <a onClick={() => setOnboarded(true)}>
              <b>Enter the Garden</b>
            </a>
        </div>)
      }
    </div>
  }
}


const WalledGardenPortalComponent = registerComponent("WalledGardenPortal", WalledGardenPortal, {styles});

declare global {
  interface ComponentTypes {
    WalledGardenPortal: typeof WalledGardenPortalComponent
  }
}
