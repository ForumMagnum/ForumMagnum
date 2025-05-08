import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';
import { Link } from '../../lib/reactRouterWrapper';
import {captureEvent, useTracking} from "../../lib/analyticsEvents";
import { BookAnimation } from "./BookAnimation";
import { BookCheckout } from "../review/BookCheckout";
import { HeadTags } from "../common/HeadTags";

const contentMaxWidth = "1050px"
const lw = () => {return (<span style={{fontVariant: "small-caps"}}>LessWrong</span>)}

const styles = (theme: ThemeType) => ({

  textSettings: {
    fontFamily: `warnock-pro,Palatino,"Palatino Linotype","Palatino LT STD","Book Antiqua",Georgia,serif`
  },

  body: {
    fontSize: '1.4em',
    fontFamily: `warnock-pro,Palatino,"Palatino Linotype","Palatino LT STD","Book Antiqua",Georgia,serif`,
    lineHeight: '1.45',
    color: theme.palette.text.slightlyDim2,
    textAlign: "justify",
    '& a': {
      color: theme.palette.primary.main
    }
  },

  bookAnimationContainer: {
    width: '1120px',
    marginLeft: 'auto',
    marginRight: 'auto',
    '--book-animation-left-offset': '75px',
    [theme.breakpoints.down('md')]: {
      width: '100%',
      maxWidth: '675px',
      marginBottom: 75
    }
  },

  bookContentContainer: {
    display: "flex",
    maxWidth: contentMaxWidth,
    marginLeft: "auto",
    marginRight: "auto",
    marginBottom: "30px"
  },

  bookContentImage: {
    width: "100%",
    height: "100%"
  },

  wrapper: {
    margin: "0 auto",
    width: "100%",
    maxWidth: "1000px",
    padding: "0 20px 0 20px",
    marginBottom: 32
  },

  bookTitle: {
    position: "relative",
    fontSize: "22px",
    fontWeight: "bold"
  },

  essaysBy: {
    alignItems: "flex-end",
    fontSize: "20px",
    color: theme.palette.text.grey,
    marginBottom: "18px"
  },

  bookSummary: {
    gridArea: "info"
  },

  authorList: {
    gridArea: "authorList",
    color: theme.palette.text.grey,
  },

  mainQuoteContainer: {
    maxWidth: '650px',
    textAlign: 'right',
    paddingLeft: '100px',
    paddingTop: '50px'
  },

  mainQuote: {
    gridArea: "mainQuote",
    fontSize: "28px",
    lineHeight: "1.4em",
    marginBottom: "15px"
  },

  mainQuoteAuthor: {
    gridArea: "mainQuoteAuthor",
    fontSize: "22px",
    lineHeight: "1.4em",
    color: theme.palette.text.grey,
  },

  buyButton: {
    display: 'flex'
  },

  amazonButton: {
    ...theme.typography.commentStyle,
    height: '36px',
    background: theme.palette.buttons.bookCheckoutButton,
    paddingLeft: 16,
    paddingRight: 16,
    color: theme.palette.buttons.primaryDarkText,
    fontSize: '14px',
    border: 0,
    fontWeight: '500',
    cursor: 'pointer',
    letterSpacing: '0.6',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
    boxShadow: `0px 4px 5.5px 0px ${theme.palette.greyAlpha(0.07)}`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    '&:hover': {
      opacity: 0.8
    },
    
    [theme.breakpoints.down('xs')]: {
      width: 175,
    },
  },

  interludeTextContainer: {
    display: "grid",
    gridGap: "3px 50px",
    gridTemplateRows: "auto auto",
    gridTemplateColumns: "1fr 1fr",
    gridTemplateAreas: `
      "interludeQuote body"
     `,
    marginBottom: '40px'
  },

  interludeBigQuote: {
    gridArea: "interludeQuote",
    fontSize: "1.6em",
    color: theme.palette.text.normal,
    textAlign: 'justify'
  },
  interludeQuoteAuthor: {
    marginTop: 10,
    textAlign: 'right'
  },
  interludeBodyText: {
    gridArea: "body",
  },

  sampleButton: {
   ...theme.typography.commentStyle,
    height: '36px',
    background: "#e4c161",
    paddingLeft: 16,
    paddingRight: 16,
    color: 'white',
    fontSize: '14px',
    border: 0,
    fontWeight: '500',
    cursor: 'pointer',
    letterSpacing: '0.6',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
    boxShadow: '0px 4px 5.5px 0px rgba(0, 0, 0, 0.07)',
    '&:hover': {
      opacity: 0.8
    },
  },
  mobileSampleButton: {
    display: "none",
    width: '100%',
    padding: '0px 16px'
  },
  bookIntroduction: {
    display: "grid",
    marginBottom: "22px",
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "1fr",
    gridGap: "5px 50px",
    gridTemplateAreas: `
      "authorList info"
    `
  },
  availabilityNotice: {
    ...theme.typography.commentStyle,
    height: 36,
    fontSize: '0.83rem',
    color: theme.palette.text.dim60,
  },
  mobileParagraph: {
    display: "none",
    padding: "0px 15px"
  },
  mobileInterlude: {
    display: "none"
  },
  desktopOnlyInterlude: {
    display: "block"
  },
  mobileBookImages: {
    display: "none"
  },
  mobileCoverImage: {
    width: '100%'
  },
  mobileSpreadImage: {
    width: '100%'
  },
  sampleButtonWrapper: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end'
  },
  faqLink: {
    ...theme.typography.commentStyle,
    display: 'flex',
    alignItems: 'center',
    height: 36,
    fontSize: '1.2rem',
    marginLeft: 16,
    marginRight: 16,
    color: theme.palette.text.dim60,
  },
  [theme.breakpoints.down('xs')]: {
    bookContentContainer: {
      display: 'none'
    },
    bookIntroduction: {
      gridTemplateColumns: "1fr",
      gridTemplateRows: "auto auto",
      gridGap: "30px",
      gridTemplateAreas: `
        "authorList"
        "info"
      `
    },
    interludeTextContainer: {
      gridTemplateAreas: `
        "interludeQuote"
        "interludeQuoteAuthor"
        "body"
      `,
      gridTemplateColumns: "1fr",
      marginBotton: "20px"
    },
    interludeBodyText: {
      display: "none"
    },
    sampleButton: {
      marginLeft: "auto",
      marginRight: "auto",
      width: '100%'
    },
    wrapper: {
      padding: "0 15px",
      marginBottom: "30px"
    },
    mainQuote: {
      display: 'none'
    },
    mainQuoteAuthor: {
      display: 'none'
    },
    mainQuoteContainer: {
      paddingBottom: 60
    },
    interludeBigQuote: {
      color: "#5e5e5e",
      lineHeight: "1.4em"
    },
    mobileParagraph: {
      display: "block"
    },
    mobileInterlude: {
      display: "block"
    },
    desktopOnlyInterlude: {
   //   visibility: "hidden",
      display: "none"
    },
    mobileBookImages: {
      display: 'block'
    },
    bookAnimationContainer: {
      marginBottom: 0
    },
    mobileSampleButton: {
      display: 'block'
    }
  },

  [theme.breakpoints.down('md')]: {
  },
})

const Hidden = ({classes}: {classes: ClassesType<typeof styles>}) => {
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


const Interlude = ({classes, imageURL, coverImageUrl, spreadImageUrl, bigQuote, bigQuoteAuthor, accentColor, bodyText}: {
  classes: ClassesType<typeof styles>,
  imageURL: string,
  coverImageUrl: string,
  spreadImageUrl: string,
  bigQuote: string,
  bigQuoteAuthor: string,
  accentColor: string,
  bodyText: JSX.Element
}) => {
  
  const { captureEvent } = useTracking()

  return (
    <div>
      <div className={classes.bookContentContainer}>
        <img className={classes.bookContentImage} src={imageURL} />
      </div>
      <div className={classes.mobileBookImages}>
        <img className={classes.mobileCoverImage} src={coverImageUrl} />
        <img className={classes.mobileSpreadImage} src={spreadImageUrl} />
      </div>
      <div className={classNames(classes.textSettings, classes.wrapper)}>
        <div className={classes.interludeTextContainer}>
          <div className={classes.interludeBigQuote}>
            {bigQuote}
            {bigQuoteAuthor && <div className={classes.interludeQuoteAuthor} style={{color: accentColor}}>
              – {bigQuoteAuthor}
            </div>}
          </div>

          <div className={classNames(classes.body, classes.interludeBodyText)}>
            {bodyText}
          </div>
        </div>
      </div>
    </div>
  )
}

const Book2018LandingInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <div>
      <HeadTags 
        image={"https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606944736/Screen_Shot_2020-11-30_at_10.17.10_PM_copy_mleu4a.png"}
        description={"LessWrong is now a book."}
      />
      <div className={classes.bookAnimationContainer}>
        <BookAnimation >
          <Hidden classes={classes} />
        </BookAnimation>
      </div>
      <div className={classNames(classes.textSettings, classes.wrapper)}>
        <div className={classes.bookTitle}>
          A Map that Reflects the Territory
        </div>
        <div className={classes.essaysBy}>
          Essays by the LessWrong community
        </div>
        <div className={classes.bookIntroduction}>
         <div className={classes.authorList}>
            <p className={classes.body}> 
              <span style={{fontWeight: "bold"}}>Scott Alexander, Eliezer Yudkowsky, Wei Dai, </span> Samo Burja, Sarah Constantin, Zvi Mowshowitz, Viktoria Krakovna, Alkjash, Paul Christiano, Ben Pace, Alex Zhu,
                Kaj Sotala, Rohin Shah, Georgia Ray, Abram Demski, Martin Sustrik, Patrick LaVictoire, Scott Garrabrant,
                Raymond Arnold, Valentine Smith, Andrew Critch, Jameson Quinn and Katja Grace
              </p>
          </div>
          <div className={classes.bookSummary}>
            <p className={classes.body}>
              {lw()} is a community blog devoted to refining the art of human rationality.
              This is a collection of our best essays from 2018, as determined <Link to="/posts/3yqf6zJSwBF34Zbys/2018-review-voting-results">by our 2018 Review</Link>. It contains over 40 redesigned graphs,
              packaged into a beautiful set of 5 books with each book small enough to fit in your pocket.
            </p>
            <div>
              <div className={classes.buyButton}>
                <a className={classes.amazonButton} href="http://www.amazon.com/Map-that-Reflects-Territory-LessWrong/dp/1736128507/ref=sr_1_1?keywords=a+map+that+reflects+the+territory">
                  Buy on Amazon  
                </a>
                <Link className={classes.faqLink} to="/posts/TTPux7QFBpKxZtMKE/the-lesswrong-book-is-available-for-pre-order">
                  Read the FAQ
                </Link>
              </div>
              <div className={classes.availabilityNotice}>
                (International orders temporarily out of stock.) 
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={classes.mobileParagraph}>
        <div className={classNames(classes.body)}>
          <p>
            Each year thousands of posts are written to LessWrong. Since 2019, users
            come together once a year to <a style={{color: "#4da056"}} href="https://www.lesswrong.com/s/uNdbAXtGdJ8wZWeNs/p/qXwmMkEBLL59NkvYR">review and vote</a> on the best posts from <span style={{fontStyle: "italic"}}>two</span> years ago.
            This is our attempt to build an online forum that rewards truth-seeking content that can stand the test of time, rather than short-term attention-seeking.
            41 of the most highly rated essays in last year's review have been compiled in this book set. Meanwhile, this year's review is just <a style={{color: "#4da056"}} href="https://www.lesswrong.com/posts/QFBEjjAvT6KbaA3dY/the-lesswrong-2019-review"> getting started</a>.
          </p>
          <p>
            A scientist does not just try to understand how life works, chemicals combine, or physical objects move.
            Rather, they use the general scientific method in each area, empirically testing their beliefs to discover what's true.
            Similarly, a rationalist does not simply try to think clearly about their personal life, how
            civilization works, or what's true in a single domain like nutrition or machine learning.
          </p>
          <p>
            A rationalist is someone who is curious about the general patterns that allow them to think clearly in <span style={{fontStyle: "italic"}} >any</span> area.
            They want to understand the laws and tools that help them make good decisions <span style={{fontStyle: "italic"}}>in general</span>. The essays here explore many elements of rationality,
            including questions about aesthetics, artificial intelligence, introspection, markets, altruism, probability theory... and much more.
          </p>
        </div>
      </div>

      <Interlude classes={classes}
        imageURL="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606885987/1_Epistemology_internals_vemtes.jpg"
        coverImageUrl="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606895065/Book%20landing%20page/Front%20covers/1_Epistemology_front.jpg"
        spreadImageUrl="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606895482/Book%20landing%20page/Contents/1_Epistemology_internals.jpg"
        bigQuote="The essays from LessWrong have been one of my favorite sources of wisdom.
            Especially in our rapidly changing world, these writings are among those that I expect
            will continue to be read many decades from now."
        bigQuoteAuthor="Vitalik Buterin (Co-founder, Ethereum)"
        accentColor="#d76061"
        bodyText={<div>
          Each year thousands of posts are written to LessWrong. Since 2019, users
            come together once a year to <a style={{color: "#4da056"}} href="https://www.lesswrong.com/s/uNdbAXtGdJ8wZWeNs/p/qXwmMkEBLL59NkvYR">review and vote</a> on the best posts from <span style={{fontStyle: "italic"}}>two</span> years ago.
            This is our attempt to build an online forum that rewards truth-seeking content that can stand the test of time, rather than short-term attention-seeking.
            41 of the most highly rated essays in last year's review have been compiled in this book set. Meanwhile, this year's review is just<a style={{color: "#4da056"}} href="https://www.lessestwrong.com/posts/QFBEjjAvT6KbaA3dY/the-lesswrong-2019-review"> getting started</a>.
          </div>}
      />

      <Interlude classes={classes}
        imageURL="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606885987/2_Agency_internals_kpbogk.jpg"
        coverImageUrl="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606895065/Book%20landing%20page/Front%20covers/2_Agency_front.jpg"
        spreadImageUrl="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606895482/Book%20landing%20page/Contents/2_Agency_internals.jpg"
        bigQuote="Whenever there’s a cutting-edge new idea making the rounds, Eliezer was writing about it 5-10 years ago.
            A deep dive into LessWrong will make you smarter."
        bigQuoteAuthor='Tim Urban (Author, "Wait But Why")'
        accentColor="#1d92cb"
        bodyText={<div>
          A scientist does not just try to understand how life works, chemicals combine, or physical objects move.
          Rather, they use the general scientific method in each area, empirically testing their beliefs to discover what's true.
          Similarly, a rationalist does not simply try to think clearly about their personal life, how
          civilization works, or what's true in a single domain like nutrition or machine learning.
            </div>}
      />

      <div className={classes.desktopOnlyInterlude}>
        <Interlude classes={classes}
          imageURL="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606885987/3_Coordination_internals_vicuiq.jpg"
          coverImageUrl="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606895065/Book%20landing%20page/Front%20covers/3_Coordination_front.jpg"
          spreadImageUrl="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606895485/Book%20landing%20page/Contents/3_Coordination_internals.jpg"
          bigQuote="Rationalists like Yudkowsky update their beliefs about the world as new information comes in, whereas many non-rationalists try to make new information fit their preconceived ideas... [In predicting the coronavirus pandemic] It seems like the rationalist community was ahead of most of the rest of us."
          bigQuoteAuthor='Scott Sumner (The Money Illusion, and Professor of Economics, George Mason University)'
          accentColor="#c7a23f"
          bodyText={<div>A rationalist is someone who is curious about the general patterns that allow them to think clearly in <span style={{fontStyle: "italic"}} >any</span> area.
              They want to understand the laws and tools that help them make good decisions <span style={{fontStyle: "italic"}}>in general</span>. The essays here explore many elements of rationality,
              including questions about aesthetics, artificial intelligence, introspection, markets, altruism, probability theory... and much more.
              </div>}
        />
      </div>

      <div className={classes.mobileInterlude}>
        <Interlude classes={classes}
          imageURL="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606885987/3_Coordination_internals_vicuiq.jpg"
          coverImageUrl="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606895065/Book%20landing%20page/Front%20covers/3_Coordination_front.jpg"
          spreadImageUrl="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606895485/Book%20landing%20page/Contents/3_Coordination_internals.jpg"
          bigQuote="The rationality community is one of the brightest lights in the modern intellectual firmament."
          bigQuoteAuthor='Bryan Caplan (Professor of Economics, George Mason University)'
          accentColor="#c7a23f"
          bodyText={<div>A rationalist is someone who is curious about the general patterns that allow them to think clearly in <span style={{fontStyle: "italic"}} >any</span> area.
              They want to understand the laws and tools that help them make good decisions <span style={{fontStyle: "italic"}}>in general</span>. The essays here explore many elements of rationality,
              including questions about aesthetics, artificial intelligence, introspection, markets, altruism, probability theory... and much more.
              </div>}
        />
      </div>

      <Interlude classes={classes}
        imageURL="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606885987/4_Curiosity_internals_2_copy_szbhto.jpg"
        coverImageUrl="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606896839/Book%20landing%20page/Front%20covers/4_Curiosity_front.jpg"
        spreadImageUrl="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606896891/Book%20landing%20page/Contents/4_Curiosity_internals.jpg"
        bigQuote='This is not a book of essays about curiosity, but rather a book of essays exemplifying it. The authors were curious about
          something, they set out to explore it, and they wrote down what they learned for the rest of us.'
        bigQuoteAuthor=''
        accentColor="#e8b10e"
        bodyText={<div className={classes.sampleButtonWrapper}>
          <button className={classes.sampleButton} type="button" onClick={() => {
            captureEvent("readSampleClicked")
            window.open("https://drive.google.com/file/d/1CLBYmVsie-dC837lmdU5roUq5ad8CAGR/view?usp=sharing")
          }}>
            Read a sample chapter
          </button>
        </div>}
      />

      <div className={classes.mobileSampleButton}>
        <button className={classes.sampleButton} type="button" onClick={() => {
          captureEvent("readSampleClicked")
          window.open("https://drive.google.com/file/d/1CLBYmVsie-dC837lmdU5roUq5ad8CAGR/view?usp=sharing")
        }}>
          Read a sample chapter
        </button>
      </div>

    </div>
  )
}

export const Book2018Landing = registerComponent('Book2018Landing', Book2018LandingInner, {
  styles,
  
  // (Manually checked that there are no horrible contrast problems in dark mode.
  // This page has a fair amount of very-no-reusable styling.)
  allowNonThemeColors: true,
});

declare global {
  interface ComponentTypes {
    Book2018Landing: typeof Book2018LandingComponent
  }
}
