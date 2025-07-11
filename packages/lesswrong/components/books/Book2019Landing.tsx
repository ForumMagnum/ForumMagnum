import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';
import { Link } from '../../lib/reactRouterWrapper';
import { useTracking } from "../../lib/analyticsEvents";
import Book2019Animation from "./Book2019Animation";
import HeadTags from "../common/HeadTags";
import LWTooltip from "../common/LWTooltip";
import ContentStyles from "../common/ContentStyles";

const lw = () => {return (<span style={{fontVariant: "small-caps"}}>LessWrong</span>)}

const styles = (theme: ThemeType) => ({
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
      "title title title title title"
      "text1 text1 text1 bookCheckout bookCheckout"
      "spread1 spread1 spread1 spread1 spread1"
      "spread1half spread1half spread1half spread1half spread1half"
      "bookStack bookStack bookStack text2 text2"
      "spread2 spread2 spread2 spread2 spread2"
      "failure failure failure molochNoWon molochNoWon"
      "failure failure failure psycholinguist psycholinguist"
      "reframing reframing reframing reframing reframing"
    `,
    [theme.breakpoints.down('xs')]: {
      gridAutoColumns: "100%",
      padding: "0 10px 0 10px",
      gridTemplateAreas: `
        "title"
        "bookCheckout"
        "text1"
        "bookStack"
        "text2"
        "failure"
        "molochNoWon"
        "header2"
        "reframing"
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
    background: theme.palette.panelBackground.default,
    height: 171,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    [theme.breakpoints.down('xs')]: {
      position: "unset",
      top: "unset"
    },
    paddingLeft: 50
  },
  spread1: {
    gridArea: "spread1"
  },
  spread1half: {
    gridArea: "spread1half"
  },
  spread2: {
    gridArea: "spread2",
  },
  videocontainer: {
    maxWidth: "960px",
    overflow: "hidden"
  },
  video: {
    width: "962px",
    position: "relative",
    left: -1
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
    gridArea: "text2",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center"
  },
  essaysBy: {
    alignItems: "flex-end",
    fontSize: "20px",
    color: theme.palette.grey[650],
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
    background: theme.palette.panelBackground.default,
    [theme.breakpoints.down('xs')]: {
      width: "100%"
    }
  },
  authorList: {
    color: theme.palette.grey[650],
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
    marginBottom: 50,
    marginLeft: 50
  },
  mainQuoteAuthor: {
    gridArea: "mainQuoteAuthor",
    fontSize: "22px",
    lineHeight: "1.4em",
    color: theme.palette.grey[650],
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
    color: theme.palette.text.invertedBackgroundText,
    display: "block",
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: 5,
    textTransform: "uppercase",
    marginTop: 8,
    marginBottom: 16,
    width: 200,
    fontSize: "1.3rem",
  },
  ctaDisabled: {
    background: theme.palette.primary.light,
    opacity: .5,
    filter: "saturation(.5)",
    color: theme.palette.text.invertedBackgroundText,
    display: "block",
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: 5,
    textTransform: "uppercase",
    marginTop: 8,
    marginBottom: 16,
    width: 200,
    cursor: "pointer",
    fontSize: "1.3rem",
  },
  availabilityNotice: {
    ...theme.typography.commentStyle,
    fontSize: '1rem',
    marginTop: 8,
    color: theme.palette.text.dim60,
  },
  faqLink: {
    ...theme.typography.commentStyle,
    fontWeight: "1rem",
    marginTop: 8,
    color: theme.palette.primary.main
  }
})

const HiddenQuote = ({classes}: {classes: ClassesType<typeof styles>}) => {
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

const Book2019Landing = ({classes}: {classes: ClassesType<typeof styles>}) => {
  const { captureEvent } = useTracking();

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
      <div className={classes.wrapper}>
        <div className={classes.title}>
          <div className={classes.bookTitle}>
            The Engines of Cognition
          </div>
          <div className={classes.essaysBy}>
            Essays by the LessWrong community
          </div>
        </div>
        <div className={classes.bookCheckout}>
          <div className={classes.bookCheckoutBackground}>
            <a className={classes.cta} onClick={() => {
              captureEvent("2019BookAmazonClicked")
              window.open("https://smile.amazon.com/dp/1736128515?ref=myi_title_dp&sa-no-redirect=1")
            }}>
              Amazon US ($30)
            </a>
            <LWTooltip title="Not available yet">
              <span className={classes.ctaDisabled} onClick={() => {
                captureEvent("2019BookAmazonClicked")
                window.open("https://smile.amazon.co.uk/Map-that-Reflects-Territory-LessWrong/dp/1736128507?sa-no-redirect=1")
              }}>
                Amazon UK (£25)
              </span>
            </LWTooltip>
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
        <ContentStyles contentType="post" className={classNames(classes.body, classes.text1)}>
          <p>{lw()} is a community blog devoted to refining the art of human rationality. This book set is a collection of our best essays from 2019, as determined by our <Link to="/posts/kdGSTBj3NA2Go3XaE/2019-review-voting-results">Annual Review</Link>.</p>
          <p>It contains over 50 essays, packaged into a beautiful set of 4 books, which form the latest addition to the LessWrong canon.is a community blog devoted to refining the art of human rationality.</p>
        </ContentStyles>
        <img className={classes.spread1} src="https://39669.cdn.cke-cs.com/rQvD3VnunXZu34m86e5f/images/740b9c8f623b83765762da9ed63ca0e26d9b622da0c60db1.jpg/w_2800" />
        <img className={classes.bookStack} src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1639200627/risks-from-learned-optimization_yk7hpc.jpg" />
        <div className={classNames(classes.body, classes.text2)}>
          <h2>Machine Learning Art</h2>
          <p>The cover designs and interior artwork were generated using machine learning, a system called VQGAN+CLIP.</p>

          <p>Based on a starting image and a text prompt, the system attempts to transform the starting image into what it expects to find on the internet connected with the text of the prompt. Below is an animation showing roughly how the process works.</p>
          
          <p>The base image was the cover of last year's LessWrong books, using the Mississippi River, and the text prompt for the first book was. <i>The Engines of Cognition by Alex Hillkurtz | System of Gears | Aquarelle | Greek Architecture | Blue on White Color Palette | Trending on Artstation</i>. The text prompt for each essay used the title of the essay.</p>
        </div>
        <div className={classes.spread2}>
          <div className={classes.videocontainer}>
            <video loop muted className={classes.video} autoPlay>
              <source src="https://res.cloudinary.com/lesswrong-2-0/video/upload/v1639001843/StraightOn_Compilation2_1_g7t4fy.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
        {/* <img className={classes.failure} src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1637102237/failure-splash_fdo2so.jpg"/>
        <img className={classes.molochNoWon} src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1637102237/moloch-hasnt-won_ndkkdu.jpg"/>
        <img className={classes.psycholinguist} src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1637102237/human-psycholinguistics_tyrpqk.jpg"/>

        <img className={classes.reframing} src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1637284917/reframing-superintelligence_rx8gjx.png"/> */}
        </div>
    </div>
  )
}

export default registerComponent('Book2019Landing', Book2019Landing, {styles});


