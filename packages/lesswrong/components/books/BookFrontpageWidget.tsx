import React from 'react';
import { useUpdate } from '../../lib/crud/withUpdate';
import { Link } from '../../lib/reactRouterWrapper';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useDialog } from '../common/withDialog';
import { useCurrentUser } from '../common/withUser';
import { legacyBreakpoints } from '../../lib/utils/theme';
import LoginPopup from "../users/LoginPopup";
import BookCheckout from "../review/BookCheckout";
import BookAnimation from "./BookAnimation";
import ContentStyles from "../common/ContentStyles";

const styles = (theme: ThemeType) => ({
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
      fontSize: '2.3rem !important',
      paddingLeft: 170,
    }
  },
  secondaryHeading: {
    marginTop: '-16px',
    fontStyle: 'italic',
    fontWeight: 'normal',
    [theme.breakpoints.down('xs')]: {
      paddingLeft: 170,
    },
    [theme.breakpoints.down(340)]: {
      display: "none",
    },
  },
  bookExplanation: {
    paddingRight: 181,
    textAlign: 'right',
    [theme.breakpoints.down('md')]: {
      paddingRight: 0
    },
    [theme.breakpoints.down('xs')]: {
      paddingRight: 16,
      width: '100%',
      textAlign: 'left',
    }
  },
  learnMore: {
    ...theme.typography.commentStyle,
    display: 'flex',
    alignItems: 'center',
    height: 36,
    fontSize: '1.2rem',
    marginLeft: 16,
    marginRight: 16,
    whiteSpace: "nowrap",
  },
  buttonRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    [theme.breakpoints.down('xs')]: {
      position: "absolute",
      left: 0, right: 0,
      top: 220,
      flexDirection: 'row-reverse',
      paddingLeft: 25,
      paddingRight: 10,
    },
    [legacyBreakpoints.maxTiny]: {
      paddingLeft: 10,
    },
  },
  closeButton: {
    ...theme.typography.commentStyle,
    position: 'absolute',
    right: '182px',
    top: '-20px',
    fontSize: '1rem',
    color: theme.palette.icon.dim2,
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
    color: theme.palette.icon.slightlyDim4,
    marginLeft: 'auto',
    display: 'none',
    whiteSpace: "nowrap",
    [theme.breakpoints.down('xs')]: {
      display: 'block'
    }
  },
  descriptionText: {
    fontSize: '0.96em',
    [theme.breakpoints.down('xs')]: {
      display: "none",
    },
  },
  disclaimerRow: {
    ...theme.typography.commentStyle,
    fontSize: '0.65em',
    color: theme.palette.text.dim40,
    marginTop: 4,
    lineHeight: '1.3'
  },
})

const BookFrontpageWidget = ({ classes }: {
  classes: ClassesType<typeof styles>,
}) => {
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
        name: "LoginPopup",
        contents: ({onClose}) => <LoginPopup onClose={onClose}/>
      });
    }
  }

  // FIXME: Unstable component will lose state on rerender
  // eslint-disable-next-line react/no-unstable-nested-components
  const BookMarketingText = ({title, subtitle, description, buttons}: {
    title: string;
    subtitle: string;
    description: string | React.JSX.Element;
    buttons: React.JSX.Element;
  }) => {
    return <ContentStyles contentType="post" className={classes.bookExplanation}>
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
    </ContentStyles>
  }

  return (
    <div className={classes.root}>
      <BookAnimation successContent={
        <BookMarketingText 
          title={"Thank you!"}
          subtitle={"You will receive a confirmation email imminently. Your order should ship within 2 weeks."}
          description={<> 
            <Link to="/posts/QB6BkkpwiecfF6Ekq/thanksgiving-prayer">Dear Global Economy</Link>, we thank thee for thy economies of scale, thy professional specialization, and thy international networks of trade under Ricardo's Law of Comparative Advantage, without which we would all starve to death while trying to assemble the ingredients for such a [book] as this.  Amen. 
          </>}
          buttons={<>
            <div className={classes.mobileCloseButton} onClick={hideClickHandler}>Hide</div>
            <Link className={classes.learnMore} to="/books">
              Learn More
            </Link>
            <BookCheckout ignoreMessages text={"Buy Another"} link="https://www.amazon.com/Map-that-Reflects-Territory-LessWrong/dp/1736128507"/>
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
            <BookCheckout link="https://www.amazon.com/Map-that-Reflects-Territory-LessWrong/dp/1736128507"/>
          </>}
        />
      </BookAnimation>
    </div>
  )
}


export default registerComponent('BookFrontpageWidget', BookFrontpageWidget, { styles });


