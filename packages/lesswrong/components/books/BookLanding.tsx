import React from 'react';
import {Components, registerComponent} from '../../lib/vulcan-lib';
import {Image} from 'cloudinary-react';
import {cloudinaryCloudNameSetting} from '../../lib/publicSettings';
import classNames from 'classnames';

const bodyFontSize = "18px"
const contentMaxWidth = "800px"
const LW = () => {return (<span style={{fontVariant: "small-caps"}}>LessWrong</span>)}

const styles = (theme: ThemeType): JssStyles => ({

  textSettings: {
    fontFamily: `warnock-pro,Palatino,"Palatino Linotype","Palatino LT STD","Book Antiqua",Georgia,serif`
  },

  body: {
    fontSize: bodyFontSize,
    fontFamily: `warnock-pro,Palatino,"Palatino Linotype","Palatino LT STD","Book Antiqua",Georgia,serif`,
    lineHeight: '1.6em',
    color: "#5e5e5e",
    textAlign: "justify"
  },

  bookAnimationContainer: {
    width: '1120px',
    marginLeft: 'auto',
    marginRight: 'auto',
    '--book-animation-left-offset': '75px',
    [theme.breakpoints.down('md')]: {
      width: '100%'
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
    height: "auto"
  },

  wrapper: {
    margin: "0 auto",
    width: "100%",
    maxWidth: "1000px",
    padding: "0 100px 0 100px"
  },

  bookTitle: {
    position: "relative",
    fontSize: "22px",
    fontWeight: "bold"
  },

  essaysBy: {
    alignItems: "flex-end",
    fontSize: "20px",
    color: "grey",
    marginBottom: "18px"
  },

  bookSummary: {
    gridArea: "info"
  },

  authorList: {
    gridArea: "authorList",
    color: "grey"
  },

  mainQuoteContainer: {
    maxWidth: '375px',
    textAlign: 'right'
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
    color: "grey"
  },

  buyButton: {
    marginBottom: "40px"
  },

  interludeTextContainer: {
    display: "grid",
    gridGap: "3px 30px",
    maxWidth: contentMaxWidth,
    gridTemplateRows: "auto auto",
    gridTemplateColumns: "1fr 1fr",
    gridTemplateAreas: `
      "interludeQuote body"
      "interludeQuoteAuthor body"
     `,
    marginBottom: '40px'
  },

  interludeBigQuote: {
    gridArea: "interludeQuote",
    fontSize: "22px",
    color: "rgba(0,0,0,0.87)"
  },
  interludeQuoteAuthor: {
 //   fontSize: "18px",
 //   fontWeight: "bold"
  },
  interludeBodyText: {
    gridArea: "body",
  },

  sampleButton: {
  //  ...theme.typography.commentStyle,
    height: '36px',
    background: "#e8b10e",
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
  bookIntroduction: {
    display: "grid",
    marginBottom: "22px",
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "1fr",
    gridGap: "5px 30px",
    gridTemplateAreas: `
      "authorList info"
    `
  },
  mobileParagraph: {
    display: "none",
    padding: "25px"
  },
  mobileInterlude: {
    display: "none"
  },
  desktopOnlyInterlude: {
    display: "block"
  },
  [theme.breakpoints.down('sm')]: {
    body: {
      lineHeight: "1.5em",
      fontSize: "16px"
    },
    bookIntroduction: {
      gridTemplateColumns: "1fr",
      gridTemplateRows: "auto auto",
      gridGap: "30px",
      gap: "30px",
      gridTemplateAreas: `
        "info"
        "authorList"
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
      marginRight: "auto"
    },
    wrapper: {
      padding: "0 15px",
      marginBottom: "30px"
    },
    mainQuoteContainer: {
      display: "none"
    },
    interludeBigQuote: {
      color: "#5e5e5e",
      lineHeight: "1.4em"
    },
    mobileParagraph: {
      visibility: "visible"
    },
    mobileInterlude: {
      display: "block"
    },
    desktopOnlyInterlude: {
   //   visibility: "hidden",
      display: "none"
    },
  },

  [theme.breakpoints.down('md')]: {
  },
})

const Hidden = ({classes}: ClassesType) => {
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


const Interlude = ({classes, imageURL, bigQuote, bigQuoteAuthor, accentColor, bodyText}: {
  classes: ClassesType,
  imageURL: string,
  bigQuote: string,
  bigQuoteAuthor: string,
  accentColor: string,
  bodyText: JSX.Element
}) => {

  return (
    <div>
      <div className={classes.bookContentContainer} style={{display: "flex"}}>
        <img className={classes.bookContentImage} src={imageURL} />
      </div>
      <div className={classNames(classes.textSettings, classes.wrapper)}>
        <div className={classes.interludeTextContainer}>
          <div className={classes.interludeBigQuote}>
            {bigQuote}
            <div className={classes.interludeQuoteAuthor} style={{color: accentColor}}>
              {bigQuoteAuthor}
            </div>
          </div>

          <div className={classNames(classes.body, classes.interludeBodyText)}>
            {bodyText}
          </div>
        </div>
      </div>
    </div>
  )
}

const BookLanding = ({classes}: {
  classes: ClassesType,
}) => {
  const {BookAnimation, BookCheckout} = Components;
  const cloudinaryCloudName = cloudinaryCloudNameSetting.get()

  return (
    <div>
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
          Essays by the {LW()} community
            </div>
        <div className={classes.bookIntroduction}>
          <div className={classes.bookSummary}>
            <p className={classes.body}>
              {LW()} is a community blog devoted to refining the art of human rationality.
              This is a collection of our best essays from 2018. It contains over 40 redesigned graphs,
              packaged into a beautiful set with each book small enough to fit in your pocket.</p>
          </div>

          <div className={classes.authorList}>
            <p className={classes.body}>
              Written by <span style={{fontWeight: "bold"}}>Scott Alexander, Eliezer Yudkowsky, Wei Dai, Samo Burja, </span>
                Sarah Constantin, Zvi Mowshowitz, Viktoria Krakovna, Alkjash, Paul Christiano, Ben Pace, Alex Zhu,
                Kaj Sotala, Rohin Shah, Georgia Ray, Abram Demski, Martin Sustrik, Patrick LaVictoire, Scott Garrabrant,
                Raymond Arnold, Valentine Smith, Andrew Critch, Jameson Quinn and Katja Grace
              </p>
          </div>
        </div>
        <div className={classes.buyButton}>
          <BookCheckout />
        </div>
      </div>

      <Interlude classes={classes}
        imageURL="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606885987/1_Epistemology_internals_vemtes.jpg"
        bigQuote="The essays from LessWrong have been one of my favorite sources of wisdom.
            Especially in our rapidly changing world, these writings are among those that I expect
            will continue to be read many decades from now."
        bigQuoteAuthor="Vitalik Buterin (Co-founder, Ethereum)"
        accentColor="#4da056"
        bodyText={<div>
          Each year thousands of posts are written to {LW()}. Since 2019, users
            come together once a year to <a style={{color: "#4da056"}} href="https://www.lesswrong.com/s/uNdbAXtGdJ8wZWeNs/p/qXwmMkEBLL59NkvYR">review and vote</a> on the best posts from <span style={{fontStyle: "italic"}}>two</span> years ago.
            This is our attempt to build an online forum that rewards truth-seeking content that can stand the test of time, rather than short-term attention-seeking.
            41 of the most highly rated essays in last year's review have been compiled in this book set. Meanwhile, this year's review is just
            <a style={{color: "#4da056"}} href="https://www.lessestwrong.com/posts/QFBEjjAvT6KbaA3dY/the-lesswrong-2019-review"> getting started</a>.
          </div>}
      />

      <Interlude classes={classes}
        imageURL="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606885987/2_Agency_internals_kpbogk.jpg"
        bigQuote="Whenever there’s a cutting-edge new idea making the rounds, Eliezer was writing about it 5-10 years ago.
            A deep dive into LessWrong will make you smarter."
        bigQuoteAuthor='Tim Urban (Author, "Wait But Why")'
        accentColor="#eb5b50"
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
          bigQuote="Whenever there’s a cutting-edge new idea making the rounds, Eliezer was writing about it 5-10 years ago.
              A deep dive into LessWrong will make you smarter."
          bigQuoteAuthor='Tim Urban (Author, "Wait But Why")'
          accentColor="#2298ce"
          bodyText={<div>A rationalist is someone who is curious about the general patterns that allow them to think clearly in <span style={{fontStyle: "italic"}} >any</span> area.
              They want to understand the laws and tools that help them make good decisions <span style={{fontStyle: "italic"}}>in general</span>. The essays here explore many elements of rationality,
              including questions about aesthetics, artificial intelligence, introspection, markets, altruism, probability theory... and much more.
              </div>}
        />
      </div>

      <div className={classes.mobileInterlude}>
        <Interlude classes={classes}
          imageURL="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606885987/3_Coordination_internals_vicuiq.jpg"
          bigQuote="The rationality community is one of the brightest lights in the modern intellectual firmament."
          bigQuoteAuthor='Bryan Caplan (Professor of Economics, George Mason University)'
          accentColor="#2298ce"
          bodyText={<div>A rationalist is someone who is curious about the general patterns that allow them to think clearly in <span style={{fontStyle: "italic"}} >any</span> area.
              They want to understand the laws and tools that help them make good decisions <span style={{fontStyle: "italic"}}>in general</span>. The essays here explore many elements of rationality,
              including questions about aesthetics, artificial intelligence, introspection, markets, altruism, probability theory... and much more.
              </div>}
        />
      </div>

      <Interlude classes={classes}
        imageURL="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606885987/4_Curiosity_internals_2_copy_szbhto.jpg"
        bigQuote='"This is not a book of essays about curiosity, but rather a book of essays exemplifying it. The authors were curious about
          something, they set out to explore it, and they wrote down what they learned for the rest of us."'
        bigQuoteAuthor=''
        accentColor="#e8b10e"
        bodyText={<div></div>}
      />

      <div className={classes.wrapper}>
        <button className={classes.sampleButton} type="button" onClick={() => window.open("https://drive.google.com/file/d/1CLBYmVsie-dC837lmdU5roUq5ad8CAGR/view?usp=sharing")}>
          Read a sample chapter
          </button>
      </div>

      <div className={classes.mobileParagraph}>
        <div className={classNames(classes.body)}>
          <div>
            Each year thousands of posts are written to {LW()}. Since 2019, users
            come together once a year to <a style={{color: "#4da056"}} href="https://www.lesswrong.com/s/uNdbAXtGdJ8wZWeNs/p/qXwmMkEBLL59NkvYR">review and vote</a> on the best posts from <span style={{fontStyle: "italic"}}>two</span> years ago.
            This is our attempt to build an online forum that rewards truth-seeking content that can stand the test of time, rather than short-term attention-seeking.
            41 of the most highly rated essays in last year's review have been compiled in this book set. Meanwhile, this year's review is just
            <a style={{color: "#4da056"}} href="https://www.lessestwrong.com/posts/QFBEjjAvT6KbaA3dY/the-lesswrong-2019-review"> getting started</a>.
          </div>
          <div>
            A scientist does not just try to understand how life works, chemicals combine, or physical objects move.
            Rather, they use the general scientific method in each area, empirically testing their beliefs to discover what's true.
            Similarly, a rationalist does not simply try to think clearly about their personal life, how
            civilization works, or what's true in a single domain like nutrition or machine learning.
          </div>
          <div>
            A rationalist is someone who is curious about the general patterns that allow them to think clearly in <span style={{fontStyle: "italic"}} >any</span> area.
            They want to understand the laws and tools that help them make good decisions <span style={{fontStyle: "italic"}}>in general</span>. The essays here explore many elements of rationality,
            including questions about aesthetics, artificial intelligence, introspection, markets, altruism, probability theory... and much more.
          </div>
        </div>
      </div>
    </div>
  )
}

const BookLandingComponent = registerComponent('BookLanding', BookLanding, {styles});

declare global {
  interface ComponentTypes {
    BookLanding: typeof BookLandingComponent
  }
}
