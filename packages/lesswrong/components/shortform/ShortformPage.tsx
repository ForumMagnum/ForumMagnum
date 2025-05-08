import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { preferredHeadingCase } from '../../themes/forumTheme';

const styles = (theme: ThemeType) => ({
  column: {
    maxWidth:680,
    margin:"auto"
  }
})

const ShortformPageInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { SingleColumnSection, ShortformThreadList, SectionTitle } = Components

  return (
    <SingleColumnSection>
      <div className={classes.column}>
        <SectionTitle title={preferredHeadingCase("Quick Takes")} />
        <ShortformThreadList />
      </div>
    </SingleColumnSection>
  )
}

export const ShortformPage = registerComponent('ShortformPage', ShortformPageInner, {styles});

declare global {
  interface ComponentTypes {
    ShortformPage: typeof ShortformPage
  }
}
