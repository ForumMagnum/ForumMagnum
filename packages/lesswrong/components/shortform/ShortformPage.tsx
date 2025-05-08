import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { preferredHeadingCase } from '../../themes/forumTheme';
import { SingleColumnSection } from "../common/SingleColumnSection";
import { ShortformThreadList } from "./ShortformThreadList";
import { SectionTitle } from "../common/SectionTitle";

const styles = (theme: ThemeType) => ({
  column: {
    maxWidth:680,
    margin:"auto"
  }
})

const ShortformPageInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
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
