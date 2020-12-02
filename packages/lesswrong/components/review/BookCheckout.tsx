import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { registerComponent } from "../../lib/vulcan-lib";
import { DatabasePublicSetting } from "../../lib/publicSettings";

const stripePublicKeySetting = new DatabasePublicSetting<null|string>('stripe.publicKey', null)

const styles = theme => ({
  root: {
    display: 'flex',
    //justifyContent: 'center',
    alignItems: 'center',
    fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
    'Helvetica Neue', 'Ubuntu', sans-serif`,
    margin: 0,
    '& section': {
      background: "#ffffff",
      display: 'flex',
      flexDirection: 'column',
      width: '400px',
      height: '112px',
      borderRadius: '6px',
      justifyContent: 'space-between'
    },
    '& img': {
      borderRadius: '6px',
      margin: '10px',
      width: '54px',
      height: '57px'
    },
    '& h3, & h5': {
      fontStyle: 'normal',
      fontWeight: '500',
      fontSize: '14px',
      lineHeight: '20px',
      letterSpacing: '-0.154px',
      color: '#242d60',
      margin: 0
    },
    '& h5': {
      opacity: '0.5'
    }
  },
  product: {
    display: 'flex',
  },
  description: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  messageParagraph: {
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: '14px',
    lineHeight: '20px',
    letterSpacing: '-0.154px',
    color: '#242d60',
    height: '100%',
    width: '100%',
    padding: '0 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box'
  },
  checkoutButton: {
    height: '36px',
    background: '#4da056',
    color: 'white',
    width: '60%',
    fontSize: '18px',
    fontFamily: `warnock-pro,Palatino,"Palatino Linotype","Palatino LT STD","Book Antiqua",Georgia,serif`,
    border: 0,
    fontWeight: '500',
    cursor: 'pointer',
    letterSpacing: '0.6',
    borderRadius: '1px',
    transition: 'all 0.2s ease',
    boxShadow: '0px 4px 5.5px 0px rgba(0, 0, 0, 0.07)',
    '&:hover': {
      opacity: 0.8
    }
  }
})

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePublicKey = stripePublicKeySetting.get()
const stripePromise = stripePublicKey && loadStripe(stripePublicKey);
const ProductDisplay = ({ handleClick, classes }) => (
  <section>
    {/* <div className={classes.product}>
      <img
        src="https://39669.cdn.cke-cs.com/rQvD3VnunXZu34m86e5f/images/a4058954c747cb0eb716b4e650d161c2601cac039adc6168.png/w_1966"
        alt="The cover of The LessWrong 2018 Review Book (A Map That Reflects the Territory)"
      />
      <div className={classes.description}>
        <h3>A Map That Reflects the Territory</h3>
        <h5>$29.00</h5>
      </div>
    </div> */}
    <button className={classes.checkoutButton} id="checkout-button" role="link" onClick={handleClick}>
      Buy the Book Set ($29)
    </button>
  </section>
);
const Message = ({ message, classes }) => (
  <section>
    <p className={classes.messageParagraph}>{message}</p>
  </section>
);
export default function BookCheckout({classes}) {
  const [message, setMessage] = useState("");
  useEffect(() => {
    // Check to see if this is a redirect back from Checkout
    const query = new URLSearchParams(window.location.search);
    if (query.get("success")) {
      setMessage("Order placed! You will receive an email confirmation.");
    }
    if (query.get("canceled")) {
      setMessage(
        "Order canceled."
      );
    }
  }, []);
  const handleClick = async (event) => {
    const stripe = await stripePromise;
    if (stripe) {
      const response = await fetch("/create-session", {
        method: "POST",
      });
      const session = await response.json();
      // When the customer clicks on the button, redirect them to Checkout.
      const result = await stripe.redirectToCheckout({
        sessionId: session.id,
      });
      if (result.error) {
        // If `redirectToCheckout` fails due to a browser or network
        // error, display the localized error message to your customer
        // using `result.error.message`.
      }
    }

  };
  return <div className={classes.root}>
    { message ? (
      <Message message={message} classes={classes} />
    ) : (
      <ProductDisplay handleClick={handleClick} classes={classes}/>
    ) }
  </div>
}

const BookCheckoutComponent = registerComponent('BookCheckout', BookCheckout, {styles});

declare global {
  interface ComponentTypes {
    BookCheckout: typeof BookCheckoutComponent
  }
}
