import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { postBodyStyles } from '../../themes/stylePiping';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    width: 1120,
    marginLeft: 'auto',
    marginRight: 'auto',
    '--book-animation-left-offset': '87.5px'
  },
  bookExplanation: {
    ...postBodyStyles(theme),
    paddingRight: 200,
  }
})

const BookFrontpageWidget = ({ classes }: {
  classes: ClassesType,
}) => {
  const { BookCheckout, BookAnimation } = Components
  return (
    <div className={classes.root}>
      <BookAnimation>
        <div className={classes.bookExplanation}>
          <h1>
            A Map that Reflects the Territory
          </h1>
          <h3>
            The best essays of LessWrong in a physical book
          </h3>
          <BookCheckout />
        </div>
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