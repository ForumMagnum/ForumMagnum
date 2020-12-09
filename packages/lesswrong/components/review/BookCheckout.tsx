import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { registerComponent } from "../../lib/vulcan-lib";
import { DatabasePublicSetting } from "../../lib/publicSettings";
import { useTracking } from "../../lib/analyticsEvents";

const stripePublicKeySetting = new DatabasePublicSetting<null|string>('stripe.publicKey', null)

const styles = theme => ({
  root: {
    ...theme.typography.commentStyle
  },
  checkoutButton: {
    ...theme.typography.commentStyle,
    height: '36px',
    background: "#53a55a", //theme.palette.primary.dark,
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
    }
  }

})

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePublicKey = stripePublicKeySetting.get()
const stripePromise = stripePublicKey && loadStripe(stripePublicKey);
const ProductDisplay = ({ handleClick, classes, text = "Pre-Order – $29"}) => (
  <button className={classes.checkoutButton} id="checkout-button" role="link" onClick={handleClick}>
    {text}
  </button>
);
const Message = ({ message, classes }) => (
  <section>
    <p className={classes.messageParagraph}>{message}</p>
  </section>
);
export default function BookCheckout({classes, ignoreMessages = false, text}: {classes: ClassesType, ignoreMessages?: boolean, text?: string}) {
  const [message, setMessage] = useState("");
  const { captureEvent } = useTracking()
  useEffect(() => {
    // Check to see if this is a redirect back from Checkout
    const query = new URLSearchParams(window.location.search);
    if (query.get("success")) {
      setMessage("Order placed! You will receive an email confirmation.");
    }
  }, []);
  const handleClick = async (event) => {
    captureEvent("preOrderButtonClicked")
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
    { (message && !ignoreMessages) ? (
      <Message message={message} classes={classes} />
    ) : (
      <ProductDisplay handleClick={handleClick} classes={classes} text={text}/>
    ) }
  </div>
}

const BookCheckoutComponent = registerComponent('BookCheckout', BookCheckout, {styles});

declare global {
  interface ComponentTypes {
    BookCheckout: typeof BookCheckoutComponent
  }
}
