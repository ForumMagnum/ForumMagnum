import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Image } from 'cloudinary-react';
import { cloudinaryCloudNameSetting } from '../../lib/publicSettings';
import Row from 'react-bootstrap/Row';
import { Button, TextField } from '@material-ui/core';

const styles = (theme: ThemeType): JssStyles => ({

  sideStripe: {
    float: "right",
    position: "absolute",
    zIndex: "4",
    top: "0",
    right: "-50px",
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
    justifyContent: "center",
    paddingLeft: "5%",
    paddingRight: "5%",
 //   position: "relative",
 //   zIndex: "5",
    marginBottom: "50px"
  },
  textBody: {

  },
  quoteContainer: {
    maxWidth: "800px",
    float: "none",
    backgroundColor: "white",
    //padding: "15px",
    borderRightStyle: "solid",
    borderWidth: "10px",
    height: "auto",
   // maxHeight: "250px",
    alignItems: "center"
  },
  quote: {
    fontSize: "54px",
    color: "#736b6b",
    marginBottom: "10px"
  },
  quoteAuthor: {
    fontSize: "33px",
    color: "grey"
  },
  fullSetImage: {
    float: "left",
    width: "68%",
    height: "auto"
  },
  contentImage: { // should make this inherit basics from "fullSetImage", but not sure how. Or they should share a parent
    float: "left",
    width: "50%",
    height: "auto"
  },
  buyButtonRoot: {
    background: "#40ad48", // 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
    borderRadius: 3,
    border: 0,
    color: 'white',
    height: 48,
   // boxShadow: '0 3px 5px 2px rgba(30, 25, 135, .3)',
    marginTop: "60px",
    fontSize: "30px"
  },
  buyButtonLabel: {
    textTransform: 'capitalize',
    fontSize: "35px"
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
  },

  textField: {
    fontSize: "22px"
  },

  coloredBand: {
    width: "100%",
    overflow: "hidden",
    marginBottom: "3%"
  },

  colorQuoteContainer: {
    margin: "5%",
    marginTop: "5%",
    marginBottom: "5%",
    marginLeft: "14%"
  },

  bigColorQuote: {
    alignItems: "center",
    fontSize: "48px",
    maxWidth: "600px",
    display: "block",
    marginBottom: "2%"
  },

  bigColorAuthor: {
    fontSize: "38px",
    color: "#aaa8ae",
  },

  largeImage: {
    width: "100%",
    height: "auto",
    display: "block",
    margin: "-13% 0px -13% 0px"
  }
})

const colorBandAndQuote = ({ classes , color, imageURL, quote, quoteAuthor}) => {
  return (
    <div>
      <div className={classes.coloredBand} style={{"backgroundColor": color}}>
        <img src={imageURL}
              className={classes.largeImage}
            />
      </div>
      <div className={classes.colorQuoteContainer}>
        <div className={classes.bigColorQuote} style={{"color": color}}>
          {quote}
        </div>
        <div className={classes.bigColorAuthor} >
          {quoteAuthor}
        </div>
      </div>
    </div>
  )
}


const BookLanding = ({ classes }: {
  classes: ClassesType,
}) => {
  const { SingleColumnSection } = Components;
  const cloudinaryCloudName = cloudinaryCloudNameSetting.get()

  return (
    <div>
      <div className={classes.row}>
        <img src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606266348/mockup_with_spines_w7bopz.png"
          className={classes.fullSetImage}
        />
        <div style={{float: "none", display: "block"}} >
          <div className={classes.quoteContainer}
            style={{borderRightColor: "white"}}
          >
            <div className={classes.quote}>
            The rationality community is one of the brightest lights in the modern intellectual firmament.
            </div>
            <div className={classes.quoteAuthor}>
            Bryan Caplan, George Mason University
            </div>
            <Button classes={{root: classes.buyButtonRoot, label: classes.buyButtonLabel}}>
              Buy the book set
            </Button>
          </div>

        </div>
      </div>
      {/* <img src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606266348/Site_side_stripe_i33qmp.png"
        className={classes.sideStripe}
      /> */}



      {colorBandAndQuote({classes,
        color: '#40AD48',
        imageURL: 'https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606523337/Book%20landing%20page/Colored%20background/1_Epistemology_Marketing.png',
        quote: 'Whenever there’s a cutting-edge new idea making the rounds, Eliezer was writing about it 5-10 years ago. A deep dive on Less Wrong will make you smarter.',
        quoteAuthor: 'Tim Urban, Author "Wait but Why"'
      })}

      {colorBandAndQuote({classes,
        color: '#c33e3f',
        imageURL: 'https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606523345/Book%20landing%20page/Colored%20background/2_Agency_Marketing.png',
        quote: 'The rationality community is one of the brightest lights in the modern intellectual firmament.',
        quoteAuthor: 'Bryan Caplan, George Mason University'
      })}

     {colorBandAndQuote({classes,
        color: '#1c9fd9',
        imageURL: 'https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606523336/Book%20landing%20page/Colored%20background/3_Coordination_Marketing.png',
        quote: 'Whenever there’s a cutting-edge new idea making the rounds, Eliezer was writing about it 5-10 years ago.',
        quoteAuthor: 'Tim Urban, Author "Wait but Why"'
      })}

      <div className={classes.coloredBand} style={{"backgroundColor": "#d9ae1a"}}>
        <img src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606525655/Book%20landing%20page/Colored%20background/Curiosity_internals_2_wide.jpg"
              className={classes.largeImage}
            />
      </div>


      {/* <div className={classes.bigColorQuote} style={{"color": "#d9ae1a"}}>
        The rationality community is one of the brightest lights in the modern intellectual firmament.
      </div>
          </div>
          <div className={classes.textColumn}>

            With essays by
            <ul>Scott Alexander</ul>
            <ul>Eliezer Yudkowsky</ul>
            <ul>Wei Dai</ul>
            <ul>Samo Burja</ul>
            <ul></ul>
            {/* Maybe use .map here instead? */}

      {/*     </div>
      //     <div className={classes.bodyText}>
      //     </div>
      //   </div>
      // </div>

      // <div className={classes.row}>
      //   <img src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606289257/Book%20landing%20page/Epistemology_internals_cropped_on_white.jpg"
      //         className={classes.contentImage}
      //       />
      //   <div className={classes.quoteContainer}
      //     style={{borderRightColor: "#4aa951"}}>
      //     <div className={classes.quoteAuthor}>
      //         Whenever there’s a cutting-edge new idea making the rounds, Eliezer was writing about it 5-10 years ago. A deep dive on Less Wrong will make you smarter.
      //     </div>
      //     <div className={classes.quote}>
      //         Tim Urban, author of "Wait But Why"
      //     </div>
      //   </div>
      // </div>

      // <div className={classes.row}>
      //   <img src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606289260/Book%20landing%20page/Curiosity_internals_white_cropped.jpg"
      //         className={classes.contentImage}
      //       />
      //   <div className={classes.quoteContainer}
      //     style={{borderRightColor: "#e8b10e"}}>
      //     <div className={classes.quoteAuthor}>
      //       The rationality community is one of the brightest lights in the modern intellectual firmament.
      //     </div>
      //     <div className={classes.quote}>
      //         Tim Urban, author of "Wait But Why"
      //     </div>
      //   </div>
      // </div>

      // <div className={classes.row}>
      //   <img src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606289258/Book%20landing%20page/Agency_internals_copy.jpg"
      //         className={classes.contentImage}
      //       />
      //   <div className={classes.quoteContainer}
      //     style={{borderRightColor: "#eb5b50"}}>
      //     <div className={classes.quote}>
      //         Whenever there’s a cutting-edge new idea making the rounds, Eliezer was writing about it 5-10 years ago. A deep dive on Less Wrong will make you smarter.
      //     </div>
      //     <div className={classes.quoteAuthor}>
      //         Tim Urban, author of "Wait But Why"
      //     </div>
      //   </div>
      // </div>

      // <div className={classes.row} style={{paddingTop: "100px", float: "right", paddingRight: "370px"}}>

      //     <div style={{fontSize: "20px", maxWidth: "400px", paddingRight: "25px"}}>
      //         Get sent the 2-3 best LessWrong posts each week.
      //     </div>

      //   <form className={classes.root} noValidate autoComplete="off">
      //     <TextField id="outlined-basic" label="Email" variant="outlined" />
      //   </form>
      // </div> */}

    </div>

  )
}

const BookLandingComponent = registerComponent('BookLanding', BookLanding, { styles });

declare global {
  interface ComponentTypes {
    BookLanding: typeof BookLandingComponent
  }
}
