import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { postBodyStyles } from '../../themes/stylePiping';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    width: 1120,
    marginLeft: 'auto',
    marginRight: 'auto',
    '--book-animation-left-offset': '87.5px',
    '@media(max-width: 1375px)': {
      width: 'calc(100vw - 250px)',
      overflow: 'hidden'
    },
    [theme.breakpoints.down('md')]: {
      width: '100%',
      maxWidth: 765,
      overflow: 'unset'
    }
  },
  mainHeading: {
    [theme.breakpoints.down('xs')]: {
      fontSize: '2.3rem'
    }
  },
  secondaryHeading: {
    marginTop: '-16px',
    fontStyle: 'italic',
    fontWeight: 'normal'
  },
  bookExplanation: {
    ...postBodyStyles(theme),
    paddingRight: 190,
    textAlign: 'right',
    [theme.breakpoints.down('md')]: {
      paddingRight: 16
    },
    [theme.breakpoints.down('xs')]: {
      paddingRight: 16,
      width: '100%',
      textAlign: 'left',
      paddingLeft: 8
    }
  },
  learnMore: {
    ...theme.typography.commentStyle,
    display: 'flex',
    alignItems: 'center',
    height: 36,
    fontSize: '1.2rem'
  },
  buttonRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
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
          <h1 className={classes.mainHeading}>
            A Map that Reflects the Territory
          </h1>
          <h4 className={classes.secondaryHeading}>
            The best essays of LessWrong in a physical book
          </h4>
          <p>
            With Essays by Eliezer Yudkowsky, Scott Alexander, Sarah Constantin, With Essays by Eliezer Yudkowsky, Scott Alexander, Sarah Constantin, With Essays by Eliezer Yudkowsky, Scott Alexander, Sarah Constantin, With Essays by Eliezer Yudkowsky, Scott Alexander, Sarah Constantin, With Essays by Eliezer Yudkowsky, Scott Alexander, Sarah Constantin,
          </p>
          <div className={classes.buttonRow}>
            <Link className={classes.learnMore} to="/books">
              Learn More
            </Link>
            <BookCheckout />
          </div>
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