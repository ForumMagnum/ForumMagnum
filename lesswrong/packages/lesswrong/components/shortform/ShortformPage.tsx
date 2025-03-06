import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { preferredHeadingCase } from '../../themes/forumTheme';
import SingleColumnSection from "@/components/common/SingleColumnSection";
import ShortformThreadList from "@/components/shortform/ShortformThreadList";
import { SectionTitle } from "@/components/common/SectionTitle";

const styles = (theme: ThemeType) => ({
  column: {
    maxWidth:680,
    margin:"auto"
  }
})

const ShortformPage = ({classes}: {
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

const ShortformPageComponent = registerComponent('ShortformPage', ShortformPage, {styles});

declare global {
  interface ComponentTypes {
    ShortformPage: typeof ShortformPageComponent
  }
}

export default ShortformPageComponent;
