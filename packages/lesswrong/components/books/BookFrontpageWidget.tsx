import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    width: 1120,
    marginLeft: 'auto',
    marginRight: 'auto'
  }
})

const BookFrontpageWidget = ({ classes }: {
  classes: ClassesType,
}) => {
  const { BookCheckout, BookAnimation } = Components
  return (
    <div className={classes.root}>
      <BookAnimation>
        <BookCheckout />
      </BookAnimation>
    </div>
  )
}


const BookFrontpageWidgetComponent = registerComponent('BookFrontpageWidget', BookFrontpageWidget, { styles });

declare global {
  interface ComponentTypes {
    BookFrontpageWidget: typeof BookFrontpageWidgetComponent
  }
}