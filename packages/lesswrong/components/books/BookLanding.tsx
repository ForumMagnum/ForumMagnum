import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Image } from 'cloudinary-react';
import { cloudinaryCloudNameSetting } from '../../lib/publicSettings';
import Row from 'react-bootstrap/Row';
import { Button, TextField } from '@material-ui/core';
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
    fontFamily: `warnock-pro,Palatino,"Palatino Linotype","Palatino LT STD","Book Antiqua",Georgia,serif`
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
    margin: "0 0 25px",
    height: "0",
    paddingBottom: "100%",
    position: "relative",
    backgroundColor: "#ffffff",
    //overflow: "hidden"
  },

  bookContentImage: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    height: "60vh"
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
    fontSize: "18px",
    color: "grey"
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

  copy: {
    fontSize: bodyFontSize,
    lineHeight: "1.4em"
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

const BookLanding = ({ classes }: {
  classes: ClassesType,
}) => {
  const { SingleColumnSection, BookAnimation } = Components;
  const cloudinaryCloudName = cloudinaryCloudNameSetting.get()

  return (
    <div>
      <BookAnimation />
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
                <p className={classes.copy}>
                {LW()} is a community blog devoted to refining the art of human rationality.
                This is a collection of best new essays by the {LW()} community, collected into a beautifully packaged set,
                each book small enough to fit in your pocket. For many who want to read {LW()}’s best recent ideas,
                this is the best way to read {LW()}.</p>
              </div>

              <div className={classes.bookActions}>
                <a className={classNames(classes.button, classes.buttonPrimary)}
                  data-analytics-source="book_scientific_freedom"
                  data-analytics-action="buy"
                  href="https://www.amazon.com/dp/0578675919/"
                  title="Buy this book on Amazon">
                </a>
              </div>

              <div className={classes.authorList}>
                <p className={classes.copy}>
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
      <section>
        <div className={classNames(classes.textSettings, classes.wrapper)}>
          <div className={classes.bookContentContainer}>
            <img className={classes.bookContentImage} src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606289257/Book%20landing%20page/Epistemology_internals_cropped_on_white.jpg" />
          </div>
          <div className={classes.interludeTextContainer}>
            <div className={classes.interludeBigQuote}>
              The essays from LessWrong have been one of my favorite sources of wisdom [...]
              Especially in our rapidly changing world, these writings are among those that I expect
              will continue to be read many decades from now.</div>
            <div className={classes.interludeQuoteAuthor} style={{color: "#40AD48"}}>
              Vitalik Buterin (Creator, <span style={{fontVariant: "small-caps"}}>Ethereum</span>)
            </div>
            <div className={classNames(classes.body, classes.interludeBodyText)}>
              A scientist is not simply someone who tries to understand how biological life works, or how chemicals combine,
              or how physical objects move, but is someone who uses the general scientific method in each area, that allows them
              to empirically test their beliefs and discover what's true. Similarly, a rationalist is not simply someone who
              tries to think clearly about their personal life, or who tries to understand how civilization works,
              or who tries to figure out what's true in a single domain like nutrition or machine learning.
            </div>
          </div>
        </div>


      </section>
    </div>

  )
}

const BookLandingComponent = registerComponent('BookLanding', BookLanding, { styles });

declare global {
  interface ComponentTypes {
    BookLanding: typeof BookLandingComponent
  }
}
