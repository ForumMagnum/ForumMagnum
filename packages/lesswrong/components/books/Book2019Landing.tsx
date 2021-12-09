import React from 'react';
import {Components, registerComponent} from '../../lib/vulcan-lib';
import classNames from 'classnames';
import { Link } from '../../lib/reactRouterWrapper';
import { captureEvent } from "../../lib/analyticsEvents";
import { postBodyStyles } from '../../themes/stylePiping';

const lw = () => {return (<span style={{fontVariant: "small-caps"}}>LessWrong</span>)}

const styles = (theme: ThemeType): JssStyles => ({
  bookAnimationContainer: {
    width: '960px',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginBottom: 60,
    gridArea: "books",
    '--book-animation-left-offset': '75px',
    [theme.breakpoints.down('md')]: {
      width: '100%',
      maxWidth: '675px'
    },
    [theme.breakpoints.down('xs')]: {
      paddingBottom: 10,
      marginBottom: 0
    }
  },
  wrapper: {
    margin: "0 auto",
    width: "100%",
    maxWidth: "1000px",
    padding: "0 20px 0 20px",
    display: 'grid',
    gridTemplateAreas: `
      "title title title"
      "text1 text1 bookCheckout"
    `,
    [theme.breakpoints.down('xs')]: {
      gridAutoColumns: "100%",
      padding: "0 10px 0 10px",
      gridTemplateAreas: `
        "title"
        "bookCheckout"
        "text1"
      `
    },
    gridGap: "40px 40px",
    marginBottom: 32,
    '& img ': {
      height: "100%",
      width: "100%",
      objectFit: "cover"
    }
  },
  title: {
    gridArea: "title",
    position: "sticky",
    top: 0,
    background: "white",
    height: 171,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    [theme.breakpoints.down('xs')]: {
      position: "unset",
      top: "unset"
    }
  },
  header2: {
    gridArea: "header2",
    ...theme.typography.display1,
    ...theme.typography.postStyle,
  },
  price: {
    fontSize: theme.typography.body1.fontSize,
    fontWeight: 600,
  },
  bookTitle: {
    position: "relative",
    ...theme.typography.display2,
    ...theme.typography.postStyle,
    marginTop: 0,
    marginBottom: 16
  },
  text1: {
    gridArea: "text1"
  },
  text2: {
    gridArea: "text2"
  },
  essaysBy: {
    alignItems: "flex-end",
    fontSize: "20px",
    color: "grey"
  },

  bookCheckout: {
    ...theme.typography.commentStyle,
    gridArea: "bookCheckout",
    display: "flex",
    textAlign: "center",
    alignItems: "center",
    flexDirection: "column",
    position: "sticky",
    top: 0
  },
  bookCheckoutBackground: {
    background: "white",
    height: 170,
    paddingTop: 20,
    [theme.breakpoints.down('xs')]: {
      width: "100%"
    }
  },
  authorList: {
    color: "grey",
    [theme.breakpoints.up('sm')]: {
      width: "60%",
    }
  },

  mainQuoteContainer: {
    maxWidth: '650px',
    textAlign: 'right',
    paddingLeft: '100px',
    paddingTop: '50px',
    [theme.breakpoints.down('xs')]: {
      display: "none"
    }
  },

  mainQuote: {
    gridArea: "mainQuote",
    fontSize: "28px",
    lineHeight: "1.4em",
    marginBottom: "15px",
  },
  body: {
    ...postBodyStyles(theme)
  },
  mainQuoteAuthor: {
    gridArea: "mainQuoteAuthor",
    fontSize: "22px",
    lineHeight: "1.4em",
    color: "grey"
  },

  failure: {
    gridArea: "failure"
  },
  molochNoWon: {
    gridArea: "molochNoWon"
  },
  psycholinguist: {
    gridArea: "psycholinguist"
  },
  reframing: {
    gridArea: "reframing"
  },

  bookStack: {
    gridArea: "bookStack"
  },
  ctaSmallText: {
    display: "flex",
    justifyContent: "space-around",
  },
  cta: {
    background: theme.palette.primary.light,
    color: "white",
    display: "block",
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: 5,
    textTransform: "uppercase",
    marginTop: 16,
    marginBottom: 16,
    fontSize: "1.3rem",
  },
  availabilityNotice: {
    ...theme.typography.commentStyle,
    fontSize: '1rem',
    marginTop: 8,
    color: 'rgba(0,0,0,0.6)'
  },
  faqLink: {
    ...theme.typography.commentStyle,
    fontWeight: "1rem",
    marginTop: 8,
    color: theme.palette.primary.main
  },
  spreads: {
    width: 1260,
    margin: "auto"
  },
  spread: {
    height: "100%",
    width: "100%",
    objectFit: "cover"
  }
})

const HiddenQuote = ({classes}: ClassesType) => {
  return (
    <div className={classes.mainQuoteContainer}>
      <div className={classes.mainQuote}>
        The rationality community is one of the brightest lights in the modern intellectual firmament.
      </div>
      <div className={classes.mainQuoteAuthor}>
        Bryan Caplan, Professor of Economics, <span style={{fontStyle: "italic"}}>George Mason University</span>
      </div>
    </div>
  )
}

const Book2019Landing = ({classes}: {
  classes: ClassesType,
}) => {
  const {Book2019Animation, HeadTags} = Components;

  return (
    <div>
      <HeadTags 
        image={"https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606944736/Screen_Shot_2020-11-30_at_10.17.10_PM_copy_mleu4a.png"}
        description={"LessWrong is now a book."}
      />
      <div className={classes.bookAnimationContainer}>
        <Book2019Animation >
          <HiddenQuote classes={classes} />
        </Book2019Animation>
      </div>
      <div className={classNames(classes.textSettings, classes.wrapper)}>
        <div className={classes.title}>
          <div className={classes.bookTitle}>
            The Engines of Cognition
          </div>
          <div className={classes.essaysBy}>
            Essays by the LessWrong community
          </div>
        </div>
        <div className={classNames(classes.body, classes.text1)}>
          {lw()} is a community blog devoted to refining the art of human rationality.
            This is a collection of our best essays from 2018, as determined <Link to="/posts/3yqf6zJSwBF34Zbys/2018-review-voting-results">by our 2018 Review</Link>. It contains over 40 redesigned graphs,
            packaged into a beautiful set of 5 books with each book small enough to fit in your pocket.
        </div>
        <div className={classes.bookCheckout}>
          <div className={classes.bookCheckoutBackground}>
            <div className={classes.price}>
              $30 for the four book set
            </div>
            <a className={classes.cta} onClick={() => {
              captureEvent("2019BookAmazonClicked")
              window.open("https://smile.amazon.com/Map-that-Reflects-Territory-LessWrong/dp/1736128507?sa-no-redirect=1")
            }}>
              Buy Now (TODO))
            </a>
            <div className={classes.ctaSmallText}>
              <div className={classes.availabilityNotice}>
                  Limited Stock
              </div>
              <Link className={classes.faqLink} to="/posts/TTPux7QFBpKxZtMKE/the-lesswrong-book-is-available-for-pre-order">
                Read the FAQ
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className={classes.spreads}>
        <img className={classes.bookStack} src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1639007530/bookSide1_lj2trs.jpg" />
        <div className={classNames(classes.body, classes.text2)}>

        </div>


        <div className={classNames(classes.header, classes.header2)}>
          ML Generated Art
        </div>

        <img className={classes.reframing} src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1637284917/reframing-superintelligence_rx8gjx.png"/>
      </div>
        
      <div className={classes.spreads}>
        <img className={classes.spread} src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1639001843/Trust-cover-with-spread-white_ckrtza.jpg"/>

        <img className={classes.spread} src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1639001843/Modularity-cover-with-spread-white_l95pen.jpg"/>

        <img className={classes.spread} src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1639001843/Failure-cover-with-spread-white_iqcwtf.jpg"/>


        <video className={classes.spread} autoPlay loop muted><source src="https://res.cloudinary.com/lesswrong-2-0/video/upload/v1639001843/StraightOn_Compilation2_1_g7t4fy.mp4" /></video>

      </div>
        {/* <video controls autoPlay>
          <source src="https://res.cloudinary.com/lesswrong-2-0/video/upload/v1639001843/StraightOn_Compilation2_1_g7t4fy.mp4" type="video/mp4"/>
        </video> */}
    </div>
  )
}

const Book2019LandingComponent = registerComponent('Book2019Landing', Book2019Landing, {styles});

declare global {
  interface ComponentTypes {
    Book2019Landing: typeof Book2019LandingComponent
  }
}
