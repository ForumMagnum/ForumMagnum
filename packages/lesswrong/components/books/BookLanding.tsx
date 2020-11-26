import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Image } from 'cloudinary-react';
import { cloudinaryCloudNameSetting } from '../../lib/publicSettings';
import Row from 'react-bootstrap/Row';
import { Button } from '@material-ui/core';

const styles = (theme: ThemeType): JssStyles => ({

  sideStripe: {
    float: "right",
    position: "absolute",
    zIndex: "4",
    top: "0",
    right: "-30px",
    width: "35%",
    maxWidth: "400px",
    height: "auto",
    marginTop: "-100px"
  },
  row: {
    margin: "auto",
    maxWidth: "1500px",
    display: "flex",
    alignItems: "center",
    paddingLeft: "5%",
    paddingRight: "5%",
    position: "relative",
    zIndex: "5",
    marginBottom: "50px"
  },
  textBody: {

  },
  quoteContainer: {
    maxWidth: "400px",
    float: "left",
    backgroundColor: "white",
    padding: "15px",
    borderRightStyle: "solid",
    borderWidth: "10px",
    height: "250px",
    maxHeight: "250px",
    alignItems: "center"
  },
  quote: {
    fontSize: "36px",
    color: "#736b6b",
    marginBottom: "10px"
  },
  quoteAuthor: {
    fontSize: "22px",
    color: "grey"
  },
  fullSetImage: {
    float: "left",
    width: "50%",
    height: "auto"
  },
  contentImage: { // should make this inherit basics from "fullSetImage", but not sure how. Or they should share a parent
    float: "left",
    width: "50%",
    height: "auto"
  },
  buyButtonRoot: {
    background: "white", // 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
    borderRadius: 3,
    border: 0,
    color: 'grey',
    height: 48,
    boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
    marginTop: "30px",
    fontSize: "16px"
  },
  buyButtonLabel: {
    textTransform: 'capitalize'
  },
  backgroundContainer: {
    position: 'relative'
  },
  mainTextBlock: {
    alignItems: "top",
   // paddingLeft: "5%", // TODO: make a common "padding left" property or similar
    margin: "auto",
    maxWidth: "1200px",
    display: "flex",
    float: "left"

  },
  oneLiner: {
    //inheritClass: "p",

  },
  textColumn: {
    fontSize: "26px",
    color: "#736b6b",
    position: "relative",
    textJustify: "left",
    width: "60%",
    maxWidth: "600px",
    alignItems: "top",
    textAlign: "justify",
    paddingRight: "50px",
    paddingLeft: "50px"
  }
})

const BookLanding = ({ classes }: {
  classes: ClassesType,
}) => {
  const { SingleColumnSection } = Components;
  const cloudinaryCloudName = cloudinaryCloudNameSetting.get()

  return (
    <div>
      <div className={classes.backgroundContainer}>
        <div className={classes.row}>
          <img src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606266348/mockup_with_spines_w7bopz.png"
            className={classes.fullSetImage}
          />
          <div>
            <div className={classes.quoteContainer}
              style={{borderRightColor: "white"}}
            >
              <div className={classes.quote}>
              The rationality community is one of the brightest lights in the modern intellectual firmament.
              </div>
              <div className={classes.quoteAuthor}>
              Bryan Caplan, George Mason University
              </div>
            </div>
            <Button classes={{root: classes.buyButtonRoot, label: classes.buyButtonLabel}}>
              Buy the book set
            </Button>
          </div>
        </div>
        <img src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606266348/Site_side_stripe_i33qmp.png"
          className={classes.sideStripe}
        />
      </div>
      <div className={classes.row}>
        <div className={classes.mainTextBlock}>
          <div className={classes.textColumn}>

              <strong>A Map that Reflects the Territory. </strong>
              The greatest writing of the LessWrong community, collected into a beautifully
              packaged book set, each book small enough to fit in your pocket.

            {/* TODO: put the author text in columns instead</p>
             */}
          </div>
          <div className={classes.textColumn}>

            With essays by
            <ul>Scott Alexander</ul>
            <ul>Eliezer Yudkowsky</ul>
            <ul>Wei Dai</ul>
            <ul>Samo Burja</ul>
            <ul></ul>
            {/* Maybe use .map here instead? */}

          </div>
          <div className={classes.bodyText}>
          </div>
        </div>
      </div>
      <div className={classes.row}>
        <img src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606289257/Book%20landing%20page/Epistemology_internals_cropped_on_white.jpg"
              className={classes.contentImage}
            />
        <div className={classes.quoteContainer}
          style={{borderRightColor: "#4aa951"}}>
          <div className={classes.quote}>
              Whenever there’s a cutting-edge new idea making the rounds, Eliezer was writing about it 5-10 years ago. A deep dive on Less Wrong will make you smarter.
          </div>
          <div className={classes.quoteAuthor}>
              Tim Urban, author of "Wait But Why"
          </div>
        </div>
      </div>

      <div className={classes.row}>
      <img src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606289260/Book%20landing%20page/Curiosity_internals_white_cropped.jpg"
              className={classes.contentImage}
            />
        <div className={classes.quoteContainer}
          style={{borderRightColor: "#e8b10e"}}>
          <div className={classes.quote}>
            The rationality community is one of the brightest lights in the modern intellectual firmament.
          </div>
          <div className={classes.quoteAuthor}>
              Tim Urban, author of "Wait But Why"
          </div>
        </div>
      </div>

      <div className={classes.row}>
        <img src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606289258/Book%20landing%20page/Agency_internals_copy.jpg"
              className={classes.contentImage}
            />
        <div className={classes.quoteContainer}
          style={{borderRightColor: "#eb5b50"}}>
          <div className={classes.quote}>
              Whenever there’s a cutting-edge new idea making the rounds, Eliezer was writing about it 5-10 years ago. A deep dive on Less Wrong will make you smarter.
          </div>
          <div className={classes.quoteAuthor}>
              Tim Urban, author of "Wait But Why"
          </div>
        </div>
      </div>

    </div>
  )
}

const BookLandingComponent = registerComponent('BookLanding', BookLanding, { styles });

declare global {
  interface ComponentTypes {
    BookLanding: typeof BookLandingComponent
  }
}
