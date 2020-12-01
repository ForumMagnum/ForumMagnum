import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({

})

const BookFrontpageWidget = ({ classes }: {
  classes: ClassesType,
}) => {
  const { SingleColumnSection, BookAnimation } = Components
  return (
    <SingleColumnSection>
      <BookAnimation />
    </SingleColumnSection>
  )
}


const BookFrontpageWidgetComponent = registerComponent('BookFrontpageWidget', BookFrontpageWidget, { styles });

declare global {
  interface ComponentTypes {
    BookFrontpageWidget: typeof BookFrontpageWidgetComponent
  }
}