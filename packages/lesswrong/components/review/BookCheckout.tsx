import React, { useState, useEffect } from "react";
// import { loadStripe } from "@stripe/stripe-js";
import { registerComponent } from "../../lib/vulcan-lib/components";
// import { DatabasePublicSetting } from "../../lib/publicSettings";
import { useTracking } from "../../lib/analyticsEvents";
import classNames from 'classnames';

// const stripePublicKeySetting = new DatabasePublicSetting<null|string>('stripe.publicKey', null)

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    
    [theme.breakpoints.down('xs')]: {
      maxWidth: 200,
    },
  },
  checkoutButton: {
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
    '&:hover': {
      opacity: 0.8
    },
    
    [theme.breakpoints.down('xs')]: {
      width: 175,
    },
  },
  buyUsButton: {
    minWidth: 140,
    marginBottom: 8,
  },
  intlButton: {
    background: theme.palette.panelBackground.default,
    marginLeft: 10,
    color: theme.palette.grey[710],
    border: `1px solid ${theme.palette.greyAlpha(.75)}`,
    
    [theme.breakpoints.down('xs')]: {
      marginLeft: 0,
    },
  },
})

// deprecated
// 
// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
// const stripePublicKey = stripePublicKeySetting.get()
// const stripePromise = stripePublicKey && loadStripe(stripePublicKey);

const ProductDisplay = ({ handleClickAmazon, text="Amazon", classes }: {
  handleClickAmazon: (event: any) => void,
  // handleClickStripe: (event: any)=>void,
  text?: string,
  classes: ClassesType<typeof styles>,
}) => {
  return <>
    <button className={classNames(classes.checkoutButton, classes.buyUsButton)} id="checkout-button-amazon-us" role="link" onClick={handleClickAmazon}>
      {`${text} (US) - $30`}
    </button>
    {/* <button className={classNames(classes.checkoutButton, classes.intlButton)} id="checkout-button" role="link" onClick={handleClickStripe}>
      {`${text} (international) - $29`}
    </button> */}
  </>
};
const Message = ({ message, classes }: {message: string, classes: ClassesType<typeof styles>}) => (
  <section>
    <p>{message}</p>
  </section>
);
export default function BookCheckoutInner({classes, ignoreMessages = false, text, link}: {classes: ClassesType<typeof styles>, ignoreMessages?: boolean, text?: string, link: string}) {
  const [message, setMessage] = useState("");
  const { captureEvent } = useTracking()
  
  useEffect(() => {
    // Check to see if this is a redirect back from Checkout
    const query = new URLSearchParams(window.location.search);
    if (query.get("success")) {
      setMessage("Order placed! You will receive an email confirmation.");
    }
  }, []);
  const handleClickAmazon = async (event: Event) => {
    captureEvent("preOrderButtonClicked")
    window.open(link, '_blank');
  }

  return <div className={classes.root}>
    { (message && !ignoreMessages) ? (
      <Message message={message} classes={classes} />
    ) : (
      <ProductDisplay handleClickAmazon={handleClickAmazon} text={text} classes={classes}/>
    ) }
  </div>
}

export const BookCheckout = registerComponent('BookCheckout', BookCheckoutInner, {styles});


