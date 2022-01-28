import { number } from 'prop-types';
import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Input from '@material-ui/core/Input';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    alignItems: "center"
  },
  disabled: {
    '& input': {
      opacity:.25,
    },
    pointerEvents: "none"
  },
  input: {

  }
});

export const DonationButton = ({classes, post}: {
  classes: ClassesType,
  post: PostsMinimumInfo
}) => {
  const [donationAmount, setDonationAmount] = useState<number|string>("")

  const currentUser = useCurrentUser()

  return <div className={classes.root}>
    <Input 
      type="number"
      className={classes.input} 
      value={donationAmount}
      placeholder="Enter amount"
      onChange={(e) => setDonationAmount(parseInt(e.target.value) || "")}
    />
    <span className={!donationAmount ? classes.disabled : null}>
      <form action="https://www.paypal.com/donate" method="post" target="_blank">
        <input type="hidden" name="business" value="43QPCYXH2WSWJ" />
        <input type="hidden" name="amount" value={donationAmount} />
        <input type="hidden" name="no_recurring" value="1" />
        <input type="hidden" name="return" value={`http://lesswrong.com/reviewVoting?amount=${donationAmount}`} />
        <input type="hidden" name="item_name" value={`${currentUser?.displayName || "Anonymous"} is donating to support ${post.title} for the Best of LessWrong prize`} />
        <input type="hidden" name="currency_code" value="USD" />
        <input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif" name="submit" title="PayPal - The safer, easier way to pay online!" alt="Donate with PayPal button" />
        <img alt="" src="https://www.paypal.com/en_US/i/scr/pixel.gif" width="1" height="1" />
      </form>
    </span>

  </div>;
}

const DonationButtonComponent = registerComponent('DonationButton', DonationButton, {styles});

declare global {
  interface ComponentTypes {
    DonationButton: typeof DonationButtonComponent
  }
}

