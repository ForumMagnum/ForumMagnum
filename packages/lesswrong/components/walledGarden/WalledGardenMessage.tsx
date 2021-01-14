import React from 'react'
import {Components, registerComponent} from '../../lib/vulcan-lib';
import {postBodyStyles} from "../../themes/stylePiping";

const styles = (theme: ThemeType): JssStyles => ({
  messageStyling: {
    ...postBodyStyles(theme),
    marginTop: "100px",
    maxWidth: 620
  },
})


const WalledGardenMessage = ({children, classes}) => {
  const { SingleColumnSection } = Components
  return <SingleColumnSection className={classes.messageStyling}>
    {children}
  </SingleColumnSection>
}

const WalledGardenMessageComponent = registerComponent('WalledGardenMessage', WalledGardenMessage, {styles});

declare global {
  interface ComponentTypes {
    WalledGardenMessage: typeof WalledGardenMessageComponent
  }
}
