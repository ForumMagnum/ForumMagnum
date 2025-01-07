import React from 'react'
import {Components, registerComponent} from '../../lib/vulcan-lib';

const styles = (theme: ThemeType) => ({
  messageStyling: {
    marginTop: "100px",
    maxWidth: 620
  },
})


const WalledGardenMessage = ({children, classes}: {
  children: React.ReactNode,
  classes: ClassesType<typeof styles>
}) => {
  const { SingleColumnSection, ContentStyles } = Components
  return <SingleColumnSection className={classes.messageStyling}>
    <ContentStyles contentType="post">
      {children}
    </ContentStyles>
  </SingleColumnSection>
}

const WalledGardenMessageComponent = registerComponent('WalledGardenMessage', WalledGardenMessage, {styles});

declare global {
  interface ComponentTypes {
    WalledGardenMessage: typeof WalledGardenMessageComponent
  }
}
