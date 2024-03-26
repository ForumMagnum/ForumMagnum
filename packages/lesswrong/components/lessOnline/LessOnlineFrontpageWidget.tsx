import React from 'react';
import { useUpdate } from '../../lib/crud/withUpdate';
import { Link } from '../../lib/reactRouterWrapper';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useDialog } from '../common/withDialog';
import { useCurrentUser } from '../common/withUser'
import classNames from 'classnames';


const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginBottom: 50,
    marginLeft: 'auto',
    marginRight: 'auto',
    position: "relative",
    width: "100%",
    zIndex: theme.zIndexes.frontpageBooks,
    // backgroundImage: 'url("https://cdn.discordapp.com/attachments/1086441174245593118/1219835448545906738/image.png?ex=660cbf4a&is=65fa4a4a&hm=6ec6ca481d73b15d7a4fbf9bb5cf303156daa3452cb4055ef55f1ee0f5bf53ee&")',
    // backgroundSize: 'cover', // Cover the entire div
    // backgroundPosition: 'center', // Center the background image
    [theme.breakpoints.down('md')]: {
      width: '100%',
      maxWidth: 765,
      overflow: 'unset',
    },
    [theme.breakpoints.down('lg')]: {
      left: 0,
    },
    [theme.breakpoints.down('xs')]: {
      marginTop: 20,
      marginBottom: 0
    }
  },
  backgroundImage: {
    display: 'flex',
    flexDirection: 'column',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundImage: 'url("https://cdn.discordapp.com/attachments/1086441174245593118/1219835448545906738/image.png?ex=660cbf4a&is=65fa4a4a&hm=6ec6ca481d73b15d7a4fbf9bb5cf303156daa3452cb4055ef55f1ee0f5bf53ee&")',
    /* height: 800px; */
    position: 'relative',
    paddingTop: '60px', /* Set a fixed height for the background image */
    paddingBottom: '140px', /* Set a fixed height for the background image */
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: '0',
      left: '0',
      width: '100%',
      height: '200px', /* Set a fixed height for the background image */
      background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0), #f8f4ee)',
      pointerEvents: 'none',
    },
  },
  loTitle: {
    // ...theme.typography.commentStyle,
    color: 'white', // theme.palette.text.secondary,  
    fontFamily: 'verdigris-mvb-pro-text, serif',
    fontSize: '56px',
    textAlign: 'center',
    lineHeight: 1.4,
    textShadow: '0px 0px 3px rgba(0, 0, 0, 1)', // Corrected the alpha value to be between 0 and 1
  },
  loSubtitle: {
    // ...theme.typography.commentStyle,
    //center the text:
    position: 'relative',
    color: 'white', // theme.palette.text.secondary,  
    fontFamily: 'verdigris-mvb-pro-text, serif',
    fontSize: '24px',
    textAlign: 'center',
    lineHeight: 1.4,
    marginBottom: '2px', // Use '2px' directly
    textShadow: '0px 0px 3px rgba(0, 0, 0, 1)', // Corrected the alpha value to be between 0 and 1
  },
  info: {
    // ...theme.typography.commentStyle,
    color: 'white', // theme.palette.text.secondary,  
    fontFamily: 'verdigris-mvb-pro-text, serif',
    fontSize: '16px',
    textAlign: 'center',
    lineHeight: 1.4,
    marginBottom: '2px', // Use '2px' directly
    textShadow: '0px 0px 3px rgba(0, 0, 0, 1)', // Corrected the alpha value to be between 0 and 1
  },
  ctaRow: {
    zIndex: 2,
    textAlign: 'center',
    paddingTop: '36px',
  },
  ctaButtonThird: {
    background: 'rgb(188, 120, 36)',
    color: 'white',
    marginRight: '10px',
    borderRadius: '5px',
    fontSize: '24px',
    padding: '10px 15px',
    opacity: 1,
    '&:hover': {
      background: '#ebba57',
    },
  },
  heading: {
    [theme.breakpoints.down('xs')]: {
      fontSize: '2.2rem !important',
      marginTop: '110px !important',
      textShadow: `
        0 0 5px ${theme.palette.background.pageActiveAreaBackground},
        0 0 10px ${theme.palette.background.pageActiveAreaBackground}, 
        0 0 20px ${theme.palette.background.pageActiveAreaBackground},
        0 0 5px ${theme.palette.background.pageActiveAreaBackground},
        0 0 10px ${theme.palette.background.pageActiveAreaBackground}, 
        0 0 20px ${theme.palette.background.pageActiveAreaBackground}
      `, 
    }
  },
  secondaryHeading: {
    marginTop: '-16px',
    fontStyle: 'italic',
    fontWeight: 'normal',
    [theme.breakpoints.down('xs')]: {
      textShadow: `
        0 0 5px ${theme.palette.background.pageActiveAreaBackground},
        0 0 10px ${theme.palette.background.pageActiveAreaBackground}, 
        0 0 20px ${theme.palette.background.pageActiveAreaBackground},
        0 0 5px ${theme.palette.background.pageActiveAreaBackground},
        0 0 10px ${theme.palette.background.pageActiveAreaBackground}, 
        0 0 20px ${theme.palette.background.pageActiveAreaBackground}
      `,  
    }
  },
  bookExplanation: {
    float: 'right',
    textAlign: "right",
    [theme.breakpoints.down('md')]: {
      paddingRight: 0
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
    marginTop: -7
  },
  buttonRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  closeButton: {
    ...theme.typography.commentStyle,
    position: 'absolute',
    right: 0,
    top: -8,
    fontSize: '1rem',
    color: theme.palette.icon.dim2,
    cursor: 'pointer',
  },
  descriptionText: {
    fontSize: '0.96em',
    [theme.breakpoints.down('xs')]: {
      display: "none",
    },
  },
  sectionTwo: {
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  }
})

const LessOnlineFrontpageWidget = ({ classes }: {
  classes: ClassesType,
}) => {
  const { BookCheckout, Book2020Animation, ContentStyles, Row } = Components
  const currentUser = useCurrentUser();
  const { mutate: updateUser } = useUpdate({
    collectionName: "Users",
    fragmentName: 'UsersCurrent',
  });
  const { openDialog } = useDialog();

  // figure out later how to handle hiding it
  // if (currentUser?.hideFrontpageBook2020Ad) return null

  const hideClickHandler = async () => {
    if (currentUser) {
      await updateUser({
        selector: { _id: currentUser._id },
        data: {
          hideFrontpageBook2020Ad: true
        },
      })
    } else {
      openDialog({
        componentName: "LoginPopup",
        componentProps: {}
      });
    }
  }

  const BookMarketingText = ({title, subtitle, description, buttons}: {
    title: string;
    subtitle: string;
    description: string | JSX.Element;
    buttons: JSX.Element;
  }) => {
    return <ContentStyles contentType="post" className={classes.bookExplanation}>
      <div className={classes.closeButton} onClick={hideClickHandler}>X</div>
      <h1 className={classes.heading}>
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
      <div className={classes.backgroundImage}>
        {/* <img className="header-img" src="https://cdn.discordapp.com/attachments/1086441174245593118/1219835448545906738/image.png?ex=660cbf4a&is=65fa4a4a&hm=6ec6ca481d73b15d7a4fbf9bb5cf303156daa3452cb4055ef55f1ee0f5bf53ee&" /> */}
      
        {/* <BookMarketingText 
          title={"LessOnline"} 
          subtitle={"A Festival of Writers Who are Wrong on the Internet"}
          description={<>Here are some words about LessOnline. They're good words, and you should come to our event.</>}
          buttons={<>
            <Link className={classes.learnMore} to="/posts/Rck5CvmYkzWYxsF4D/book-launch-the-carving-of-reality-best-of-lesswrong-vol-iii">
              Learn More
            </Link>
            <BookCheckout link={"https://www.amazon.com/Carving-Reality-Essays-LessWrong-Community/dp/B0C95MJJBK"}/>
          </>}
        /> */}
        <div className={classes.loTitle}>LessOnline</div>
        <div className={classes.loSubtitle}>
          <em>A Festival of Writers Who are Wrong on the Internet</em>
          {/* <div class="info-icon">
            <i class="fas fa-info-circle"></i>
            <div class="info-popup">
              <p>But Striving To Be Less So</p>
            </div>
          </div> */}
        </div>
        <div className={classes.info}><em><a href="https://www.lighthaven.space/">Berkeley, CA, Lighthaven</a>: May 31 - Jun 2</em>
        </div>
        <div className={classes.ctaRow}>
          <a href="https://less.online/" className={classes.ctaButtonThird}>
            Visit Site
          </a>
        </div>        
                {/* <Book2020Animation>
          <BookMarketingText 
            title={"LessOnline"} 
            subtitle={"A Festival of Writers Who are Wrong on the Internet"}
            description={<>Here are some words about LessOnline. They're good words, and you should come to our event.</>}
            buttons={<>
              <Link className={classes.learnMore} to="/posts/Rck5CvmYkzWYxsF4D/book-launch-the-carving-of-reality-best-of-lesswrong-vol-iii">
                Learn More
              </Link>
              <BookCheckout link={"https://www.amazon.com/Carving-Reality-Essays-LessWrong-Community/dp/B0C95MJJBK"}/>
            </>}
          />
        </Book2020Animation> */}
      </div>
    </div>
  )
}


const LessOnlineFrontpageWidgetComponent = registerComponent('LessOnlineFrontpageWidget', LessOnlineFrontpageWidget, { styles });

declare global {
  interface ComponentTypes {
    LessOnlineFrontpageWidget: typeof LessOnlineFrontpageWidgetComponent
  }
}
