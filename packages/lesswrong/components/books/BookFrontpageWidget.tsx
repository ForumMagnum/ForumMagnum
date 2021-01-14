import React from 'react';
import { useUpdate } from '../../lib/crud/withUpdate';
import { Link } from '../../lib/reactRouterWrapper';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { postBodyStyles } from '../../themes/stylePiping';
import { useDialog } from '../common/withDialog';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    width: 1120,
    marginLeft: 'auto',
    marginRight: 'auto',
    zIndex: theme.zIndexes.frontpageBooks,
    position: "relative",
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
    paddingRight: 181,
    textAlign: 'right',
    [theme.breakpoints.down('md')]: {
      paddingRight: 0
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
    fontSize: '1.2rem',
    marginLeft: 16,
    marginRight: 16
  },
  buttonRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'row-reverse'
    }
  },
  closeButton: {
    ...theme.typography.commentStyle,
    position: 'absolute',
    right: '182px',
    top: '-20px',
    fontSize: '1rem',
    color: 'rgba(0,0,0,0.4)',
    cursor: 'pointer',
    [theme.breakpoints.down('md')]: {
      right: 0
    },
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    }
  },
  mobileCloseButton: {
    ...theme.typography.commentStyle,
    fontSize: '1.1rem',
    color: 'rgba(0,0,0,0.6)',
    marginLeft: 'auto',
    display: 'none',
    [theme.breakpoints.down('xs')]: {
      display: 'block'
    }
  },
  descriptionText: {
    fontSize: '0.96em'
  },
  disclaimerRow: {
    ...theme.typography.commentStyle,
    fontSize: '0.65em',
    color: 'rgba(0,0,0,0.4)',
    marginTop: 4,
    lineHeight: '1.3'
  },
  shippingNotice: {
    ...theme.typography.commentStyle,
    height: 36,
    fontSize: '0.83rem',
    color: 'rgba(0,0,0,0.6)'
  }
})

const BookFrontpageWidget = ({ classes }: {
  classes: ClassesType,
}) => {
  const { BookCheckout, BookAnimation } = Components
  const currentUser = useCurrentUser();
  const { mutate: updateUser } = useUpdate({
    collectionName: "Users",
    fragmentName: 'UsersCurrent',
  });
  const { openDialog } = useDialog();

  if (currentUser?.hideFrontpageBookAd) return null

  const hideClickHandler = async () => {
    if (currentUser) {
      await updateUser({
        selector: { _id: currentUser._id },
        data: {
          hideFrontpageBookAd: true
        },
      })
    } else {
      openDialog({
        componentName: "LoginPopup",
        componentProps: {}
      });
    }
  }

  const BookMarketingText = ({title, subtitle, description, buttons}) => {
    return <div className={classes.bookExplanation}>
      <div className={classes.closeButton} onClick={hideClickHandler}>X</div>
      <h1 className={classes.mainHeading}>
        {title}
      </h1>
      <h4 className={classes.secondaryHeading}>
        {subtitle}
      </h4>
      <p className={classes.descriptionText}>
        {description}
      </p>
      <div className={classes.buttonRow}>
        {buttons}
      </div>
      <div className={classes.shippingNotice}>
        (Orders placed today arrive after Christmas)
      </div>
    </div>
  }

  return (
    <div className={classes.root}>
      <BookAnimation successContent={
        <BookMarketingText 
          title={"Thank you!"}
          subtitle={"You will receive a confirmation email imminently."}
          description={<> 
            <Link to="/posts/QB6BkkpwiecfF6Ekq/thanksgiving-prayer">Dear Global Economy</Link>, we thank thee for thy economies of scale, thy professional specialization, and thy international networks of trade under Ricardo's Law of Comparative Advantage, without which we would all starve to death while trying to assemble the ingredients for such a [book] as this.  Amen. 
          </>}
          buttons={<>
            <div className={classes.mobileCloseButton} onClick={hideClickHandler}>Hide</div>
            <Link className={classes.learnMore} to="/books">
              Learn More
            </Link>
            <BookCheckout ignoreMessages text={"Buy Another Book"}/>
          </>}
        />
      }>
        <BookMarketingText 
          title={"A Map that Reflects the Territory"} 
          subtitle={"The best LessWrong essays from 2018, in a set of physical books"}
          description={"A beautifully designed collection of books, each small enough to fit in your pocket. The book set contains over forty chapters by more than twenty authors including Eliezer Yudkowsky and Scott Alexander. This is a collection of opinionated essays exploring argument, aesthetics, game theory, artificial intelligence, introspection, markets, and more, as part of LessWrong's mission to understand the laws that govern reasoning and decision-making, and build a map that reflects the territory."}
          buttons={<>
            <div className={classes.mobileCloseButton} onClick={hideClickHandler}>Hide</div>
            <Link className={classes.learnMore} to="/books">
              Learn More
            </Link>
            <BookCheckout />
          </>}
        />
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
