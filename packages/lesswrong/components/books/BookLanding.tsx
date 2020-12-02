import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Image } from 'cloudinary-react';
import { cloudinaryCloudNameSetting } from '../../lib/publicSettings';
import classNames from 'classnames';

const bodyFontSize = "18px"
const LW = () => {return (<span style={{fontVariant:"small-caps"}}>LessWrong</span>)}

const styles = (theme: ThemeType): JssStyles => ({
  bookBlock: {
    '.parent-container:hover .book-container': {
      marginRight: 'calc(-160px + var(--right-margin-adjustment))';
    }
  },
  // div: {
  //   display: "block",

  // },

  textSettings: {
    fontFamily: `warnock-pro,Palatino,"Palatino Linotype","Palatino LT STD","Book Antiqua",Georgia,serif`
  },

  body: {
    fontSize: bodyFontSize,
    fontFamily: `warnock-pro,Palatino,"Palatino Linotype","Palatino LT STD","Book Antiqua",Georgia,serif`,
    lineHeight: '1.6em'
  },

  outerWrapper: {
    position: "relative",
    margin: "0 0 80px"
  },

  title: {
    margin: "0",
    color: "rgb(61, 66, 78)"
  },

  bookContentContainer: {
  //  margin: "0 0 25px",
//    height: "0",
 //   paddingBottom: "100%",
    position: "relative",
    backgroundColor: "#ffffff",
    display: "flex"

    //overflow: "hidden"
  },

  bookContentImage: {
    // position: "absolute",
    // top: "50%",
    // left: "50%",
    // transform: "translate(-50%, -50%)",
    height: "60vh",
    margin: "auto auto"
  },

  wrapper: {
    margin: "0 auto",
    width: "100%",
    maxWidth: "1000px",
    padding: "0 15px"
  },

  bookMeta: {
    display: "grid",
    gridGap: "18px 0",
    gap: "18px 0",
    maxWidth: "800px",
    gridTemplateRows: "auto auto",
    gridTemplateColumns: "1fr",
    gridTemplateAreas: `

      "aboutTitle"
      "authorList"
      "actions"
      `
  },

  container: {},
  bookTitle: {
  //  gridArea: "title",
 //   margin: "0 0 25px",
 //   height: "0",
//    paddingBottom: "100%",
    position: "relative",
    backgroundColor: "#ffffff",
    fontSize: "22px",
    fontWeight: "bold"
//    overflow: "hidden"
  },

  essaysBy: {
 //   gridArea: "aboutTitle",
    alignItems: "flex-end",
 //   fontStyle: "italic",
    fontSize: "20px",
    color: "grey",
    marginBottom: "18px"
  },

  superTitle: {},
  bookAuthor: {},
  bookActions: {
    gridArea: "actions",
    alignItems: "flex-start"
  },

  bookInfo: {
    gridArea: "info"
  },


  button: {},
  buttonPrimary: {},
  authorList: {
    gridArea: "authorList"
  },

  topGrid: {
    display: "grid",
    gridGap: "3px 0",
   // gap: "18px 0",
    gridTemplateRows: "auto auto",
    gridTemplateColumns: "1fr",
    gridTemplateAreas: `
      "mainQuote"
      "mainQuoteAuthor"
      "fullSet"
      "buyButton"
    `
  },

  fullSetContainer: {
    gridArea: "fullSet",
    margin: "0 0 25px",
    height: "0",
    paddingBottom: "100%",
    position: "relative",
    backgroundColor: "#ffffff",
    overflow: "hidden"
  },

  fullSetImage: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    height: "100%"
  },

  mainQuote: {
    gridArea: "mainQuote",
    fontSize: "28px",
    lineHeight: "1.2em"
  },
  mainQuoteAuthor: {
    gridArea: "mainQuoteAuthor",
    fontSize: "25px",
    lineHeight: "1.3em",
    color: "grey"
  },
  buyButton: {
    gridArea: "buyButton"
  },

  interludeTextContainer: {
    display: "grid",
    gridGap: "3px 0",
    gridTemplateRows: "auto auto",
    gridTemplateColumns: "1fr",
    gridTemplateAreas: `
      "interludeQuote"
      "interludeQuoteAuthor"
      "body
    `
  },

  interludeBigQuote: {
    gridArea: "interludeQuote",
    fontSize: "25px"
  },
  interludeQuoteAuthor: {
    gridArea: "interludeQuoteAuthor",
    fontSize: "22px"
  },
   interludeBodyText: {
     gridArea: "body",
     color: "grey"
  //   fontSize:
  },
  dummy: {
    gridArea: "dummy"
  },

  '@media (min-width: 670px)': {
    wrapper: {
      padding: "0 15px"
    },
    bookMeta: {
      gridTemplateColumns: "1fr 1fr",
      gridTemplateRows: "1fr",
      gridGap: "30px",
      gap: "30px",
      gridTemplateAreas: `
        "info authorList"
        "actions authorList"
      `
    },
    topGrid: {
      gridTemplateAreas: `
        "fullSet mainQuote"
        "fullSet mainQuoteAuthor"
        "fullSet buyButton"
      `,
      gridTemplateColumns: "1fr 1fr"
    },
    interludeTextContainer: {
      gridTemplateAreas: `
        "interludeQuote body"
        "interludeQuoteAuthor body"
      `,
      gridTemplateColumns: "1fr 1fr"
    }
  },
  '@media (min-width: 880px)': {
    bookCover: {
      paddingBottom: "70%",
      margin: "0 0 53px"
    },
    wrapper: {
      padding: "0 60px 0 160px"
    },
    bookMeta: {
      gridGap: "5px 30px",
      gap: "25px 60px"
    },
    bookActions: {
      justifyContent: "flex-start"
    },
    fullSetImage: {
      width: "100%",
      height: "auto"
    },

  },
})


const Interlude = ({ classes, imageURL, bigQuote, bigQuoteAuthor, accentColor, bodyText }: {
  classes: ClassesType,
  imageURL: string,
  bigQuote: string,
  bigQuoteAuthor: string,
  accentColor: string,
  bodyText: string
}) => {

  return (
    <div>
      <div className={classes.bookContentContainer} style={{display: "flex"}}>
        <img className={classes.bookContentImage} src={imageURL} />
      </div>
      <div className={classNames(classes.textSettings, classes.wrapper)}>
        <div className={classes.interludeTextContainer}>
          <div className={classes.interludeBigQuote}>
            {bigQuote}</div>
          <div className={classes.interludeQuoteAuthor} style={{color: accentColor}}>
            {bigQuoteAuthor}
          </div>
          <div className={classNames(classes.body, classes.interludeBodyText)}>
            {bodyText}
          </div>
        </div>
      </div>
    </div>
  )
}

const BookLanding = ({ classes }: {
  classes: ClassesType,
}) => {
  const { SingleColumnSection, BookAnimation, } = Components;
  const cloudinaryCloudName = cloudinaryCloudNameSetting.get()

  return (
    <div>
      <div style={{display: "flex"}}>
        <div style={{margin: "auto auto"}}>
          <BookAnimation />
        </div>
      </div>

      <section>
        <div className={classes.outerWrapper}>
          <div className={classNames(classes.textSettings, classes.wrapper)}>
            <div className={classes.topGrid}>
              {/* <div className={classes.fullSetContainer}>
                <img className={classes.fullSetImage} src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606266348/mockup_with_spines_w7bopz.png" alt="LessWrong book set" />
              </div> */}
              <div className={classes.mainQuote}>
                The rationality community is one of the brightest lights in the modern intellectual firmament.
              </div>
              <div className={classes.mainQuoteAuthor}>
                Bryan Caplan, Professor of Economics, <span style={{fontStyle: "italic"}}>George Mason University</span>
              </div>
              <div className={classes.buyButton}>
                <BookCheckout />
                <button>Buy the Book Set ($29)</button>
              </div>
            </div>

            <div className={classes.bookTitle}>
                A Map that Reflects the Territory
              </div>

              <div className={classes.essaysBy}>
                Essays by the {LW()} community
              </div>
            <div className={classes.bookMeta}>

              <div className={classes.bookInfo}>
                <p className={classes.body}>
                {LW()} is a community blog devoted to refining the art of human rationality.
                This is a collection of the best new essays by the {LW()} community, with over 40 redesigned graphs,
                packaged into beautiful set with each book small enough to fit in your pocket.</p>
              </div>

              <div className={classes.bookActions}>
                <a className={classNames(classes.button, classes.buttonPrimary)}
                  data-analytics-source="book_scientific_freedom"
                  data-analytics-action="buy"
                  href=""
                  title="Buy this book on Amazon">
                </a>
              </div>

              <div className={classes.authorList}>
                <p className={classes.body}>
                  <span style={{fontWeight: "bold"}}>Scott Alexander, Eliezer Yudkowsky, Wei Dai, Samo Burja, </span>
                  Sarah Constantin, Zvi Mowshowitz, Viktoria Krakovna, Alkjash, Paul Christiano, Ben Pace, Alex Zhu,
                  Kaj Sotala, Rohin Shah, Georgia Ray, Abram Demski, Martin Sustrik, Patrick LaVictoire, Scott Garrabrant,
                  Raymond Arnold, Valentine Smith, Andrew Critch, Jameson Quinn, Katja Grace
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
        <Interlude classes={classes}
          imageURL="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606289257/Book%20landing%20page/Epistemology_internals_cropped_on_white.jpg"
          bigQuote="The essays from LessWrong have been one of my favorite sources of wisdom [...]
            Especially in our rapidly changing world, these writings are among those that I expect
            will continue to be read many decades from now."
          bigQuoteAuthor="Vitalik Buterin (Co-founder, Ethereum)"
          accentColor="#40AD48"
          bodyText="A scientist is not simply someone who tries to understand how life works, chemicals combine, or physical objects move.
            They are someone who uses the general scientific method in each area, empirically testing their beliefs and discover what's true.
            Similarly, a rationalist is not simply someone who tries to think clearly about their personal life, or who tries to understand how
            civilization works, or who tries to figure out what's true in a single domain like nutrition or machine learning."
          />

        <Interlude classes={classes}
          imageURL="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606289258/Book%20landing%20page/Agency_internals_copy.jpg"
          bigQuote="Whenever there’s a cutting-edge new idea making the rounds, Eliezer was writing about it 5-10 years ago.
            A deep dive into LessWrong will make you smarter."
          bigQuoteAuthor='Tim Urban (Author, "Wait But Why")'
          accentColor="#eb5b50"
          bodyText="A rationalist is someone who is curious about the general thinking patterns that allow them to think clearly in any area,
            and understand the laws and tools that help them make good decisions in general. The essays here explore many elements of rationality,
            including questions about arguments, aesthetics, artificial intelligence, bayesianism, introspection, markets, game theory, and more."
          />

        <Interlude classes={classes}
          imageURL="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606289260/Book%20landing%20page/Curiosity_internals_white_cropped.jpg"
          bigQuote="Whenever there’s a cutting-edge new idea making the rounds, Eliezer was writing about it 5-10 years ago.
            A deep dive into LessWrong will make you smarter."
          bigQuoteAuthor='Tim Urban (Author, "Wait But Why")'
          accentColor="#e8b10e"
          bodyText="LessWrong is a community blog devoted to refining the art of human rationality.
            Each year thousands of posts are written to the site. The users of the site reviewed and voted on the best posts in the last year,
            and forty-one of the best posts were formed into this beautiful and professionally designed book set,
            each book focused on a single theme related to the art of rationality."
          />

        <button type="button" onClick={() => window.open("https://drive.google.com/file/d/1CLBYmVsie-dC837lmdU5roUq5ad8CAGR/view?usp=sharing")}>
          Read a free sample chapter.
        </button>

    </div>

  )
}

const BookLandingComponent = registerComponent('BookLanding', BookLanding, { styles });

declare global {
  interface ComponentTypes {
    BookLanding: typeof BookLandingComponent
  }
}
