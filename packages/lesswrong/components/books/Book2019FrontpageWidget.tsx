import React from 'react';
import { useUpdate } from '../../lib/crud/withUpdate';
import { Link } from '../../lib/reactRouterWrapper';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useDialog } from '../common/withDialog';
import { useCurrentUser } from '../common/withUser';
import { LoginPopup } from "../users/LoginPopup";
import { BookCheckout } from "../review/BookCheckout";
import { Book2019Animation } from "./Book2019Animation";
import { ContentStyles } from "../common/ContentStyles";

const styles = (theme: ThemeType) => ({
  root: {
    width: 960,
    marginBottom: 50,
    marginLeft: 'auto',
    marginRight: 'auto',
    zIndex: theme.zIndexes.frontpageBooks,
    position: "relative",
    '--book-animation-left-offset': '22.0px',
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
    paddingRight: 100,
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
      flexDirection: 'row-reverse',
      flexWrap: 'wrap-reverse',
      marginLeft: 169,
      paddingRight: 10,
    },
  },
  closeButton: {
    ...theme.typography.commentStyle,
    position: 'absolute',
    right: '103px',
    top: '-24px',
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

const Book2019FrontpageWidgetInner = ({ classes }: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const { mutate: updateUser } = useUpdate({
    collectionName: "Users",
    fragmentName: 'UsersCurrent',
  });
  const { openDialog } = useDialog();

  if (currentUser?.hideFrontpageBook2019Ad) return null

  const hideClickHandler = async () => {
    if (currentUser) {
      await updateUser({
        selector: { _id: currentUser._id },
        data: {
          hideFrontpageBook2019Ad: true
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
    description: string | JSX.Element;
    buttons: JSX.Element;
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
      <Book2019Animation successContent={
        <BookMarketingText 
          title={"Thank you!"}
          subtitle={"You will receive a confirmation email imminently. Your order should ship within 2 weeks."}
          description={<> 
            <Link to="/posts/QB6BkkpwiecfF6Ekq/thanksgiving-prayer">Dear Global Economy</Link>, we thank thee for thy economies of scale, thy professional specialization, and thy international networks of trade under Ricardo's Law of Comparative Advantage, without which we would all starve to death while trying to assemble the ingredients for such a [book] as this.  Amen. 
          </>}
          buttons={<>
            <div className={classes.mobileCloseButton} onClick={hideClickHandler}>Hide</div>
            <Link className={classes.learnMore} to="/books/2019">
              Learn More
            </Link>
            <BookCheckout ignoreMessages text={"Buy Another"} link={"https://www.amazon.com/Engines-Cognition-Essays-LessWrong-Community/dp/1736128515/"}/>
          </>}
        />
      }>
        <BookMarketingText 
          title={"The Engines of Cognition"} 
          subtitle={"Newly Published Essays by the LessWrong Community"}
          description={"In this new essay collection, LessWrong writers seek to understand key elements of the art of rationality. The collection features essays from Eliezer Yudkowsky, Scott Alexander, Zvi Mowshowitz, and over 30 more LessWrong writers. Starting with the simple epistemic question of when and how to trust different sources of information, the essays in the books move through understanding the lens of incentives, an exploration of when and why complex systems become modular, and finally into a discussions of failure, both personal and civilizational."}
          buttons={<>
            <div className={classes.mobileCloseButton} onClick={hideClickHandler}>Hide</div>
            <Link className={classes.learnMore} to="/posts/mvPfao35Moah8py46/the-engines-of-cognition-book-launch">
              Learn More
            </Link>
            <BookCheckout link={"https://www.amazon.com/Engines-Cognition-Essays-LessWrong-Community/dp/1736128515/"}/>
          </>}
        />
      </Book2019Animation>
    </div>
  )
}


export const Book2019FrontpageWidget = registerComponent('Book2019FrontpageWidget', Book2019FrontpageWidgetInner, { styles });

declare global {
  interface ComponentTypes {
    Book2019FrontpageWidget: typeof Book2019FrontpageWidgetComponent
  }
}
