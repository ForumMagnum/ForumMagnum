import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  column: {
    maxWidth:680,
    margin:"auto"
  }
})

const ShortformPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { SingleColumnSection, ShortformThreadList, SectionTitle } = Components

  return (
    <SingleColumnSection>
      <div className={classes.column}>
        <SectionTitle title="Shortform Content"/>
        <ShortformThreadList />
      </div>
    </SingleColumnSection>
  )
}

const ShortformPageComponent = registerComponent('ShortformPage', ShortformPage, {styles});

declare global {
  interface ComponentTypes {
    ShortformPage: typeof ShortformPageComponent
  }
}
