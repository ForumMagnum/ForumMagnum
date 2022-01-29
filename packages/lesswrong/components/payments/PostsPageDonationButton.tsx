import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Input from '@material-ui/core/Input';
import { useCurrentUser } from '../common/withUser';
import { commentBodyStyles, postBodyStyles } from '../../themes/stylePiping';
import { useTracking } from '../../lib/analyticsEvents';
import classNames from 'classnames';
import { postIsReviewWinner } from '../../lib/reviewUtils';
import { Link } from '../../lib/reactRouterWrapper';
import Card from '@material-ui/core/Card';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    padding: 20,
    textAlign: "center",
    ...commentBodyStyles(theme),
    display: "flex",
    flexDirection: "column",
    marginBottom: 30
  },
  wrapper: {
    margin: "auto",
  },
  disabled: {
    opacity:.55,
    pointerEvents: "none"
  },
  input: {
    ...commentBodyStyles(theme),
    width: 120,
    margin: "auto",
    '& input': {
      textAlign: "center",
      '-webkit-appearance': "none",
      '-moz-appearance': "none"
    }
  },
  bestOfLessWrong: {
    ...postBodyStyles(theme),
  },
  button: {
    border: `solid 1px ${theme.palette.grey[500]}`,
    borderRadius: 3,
    display: "inline-block",
    margin: "auto"
  },
  buttonTitle: {
    textTransform: "uppercase",
    ...theme.typography.smallText,
    color: theme.palette.grey[600],
    padding: 10,
    paddingLeft: 10,
    paddingRight: 10,
    cursor: "pointer"
  },
  form: {
    padding: 10,
    paddingBottom: 0,
    display: "flex",
    flexDirection: "column"
  },
  submit: {
    textTransform: "uppercase",
    fontWeight: "600",
    ...theme.typography.body2,
    color: theme.palette.primary.main,
    padding: 10,
    backgroundColor: "unset",
    marginTop: 5
  },
  cancel: {
    padding: 10,
    textTransform: "uppercase",
    fontWeight: "600",
    ...theme.typography.body2,
    color: theme.palette.grey[500],
    cursor: "pointer"
  },
  finePrint: {
    marginTop: 10,
    fontSize: 12,
    color: theme.palette.grey[500]
  },
  preview: {
    padding: 20,
    width: 500,
    ...postBodyStyles(theme),
    fontSize: theme.typography.body2.fontSize,
  }
});

export const PostsPageDonationButton = ({classes, post, message}: {
  classes: ClassesType,
  post: PostsDetails,
  message?: string
}) => {

  const { LWTooltip } = Components

  const [donationAmount, setDonationAmount] = useState<number|string>("")

  const { captureEvent } = useTracking()
  const currentUser = useCurrentUser()  
  const [showForm, setShowForm] = useState<boolean>(false)

  // limit donations to less than 1
  const finalDonationAmount = donationAmount < 15000 ? (donationAmount || 0) : 14999

  const handleShowForm = () => {
    captureEvent("donateToBestOfLessWrongAuthorClicked")
    setShowForm(true)
  }

  const registerDonation = () => {
    captureEvent("donateToBestOfLessWrongAuthorBegunDonation")
  }

  // if (!postIsReviewWinner(post)) return null

  return <div className={classes.root}>
          <p className={classes.bestOfLessWrong}>
            <LWTooltip tooltip={false} title={<Card className={classes.preview}>
              <h3>Best of LessWrong 2020: Voting Results</h3>
              <p>After two months of reviewing and voting, the results for the top posts of 2020 are in. Winning posts will be aggregated into the <Link to="/bestoflesswrong">Best of LessWrong sequences</Link>, and given tip jars where people can donate to show their support.</p>
              <p>The winners are...</p>
              <p><em>*drumroll*...</em></p>
            </Card>}>
              <Link to={"/posts/WHoukwqEYvz2AGtwY/best-of-lesswrong-2020-voting-results"}>
                Best of LessWrong 2020
              </Link>
            </LWTooltip>
          </p>
          <span className={classes.button}>
            <div className={classes.buttonTitle} onClick={handleShowForm}>
              Tip {(post.coauthors?.length > 0) ? "authors" : "author"}
            </div>
            {showForm && <div className={classes.form}>
              <Input 
                type="number"
                className={classes.input} 
                value={donationAmount}
                placeholder="Enter amount"
                onChange={(e) => setDonationAmount(parseInt(e.target.value) || "")}
              />  
              <form action="https://www.paypal.com/donate" method="post" target="_blank">
                <input type="hidden" name="amount" value={finalDonationAmount} />
                <input type="hidden" name="no_recurring" value="1" />
                <input type="hidden" name="item_name" value={`${currentUser?.displayName || "Anonymous"} is donating to support ${post.title} for the Best of LessWrong prize`} />
                <input type="hidden" name="hosted_button_id" value="ZMFZULZHMAM9Y" />
                <input type="hidden" name="return" value={`http://lesswrong.com/reviewVoting?amount=${donationAmount}`} />
                {/* <input type="submit" src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif" name="submit" title="PayPal - The safer, easier way to pay online!" alt="Donate with PayPal button" /> */}
                <img alt="" src="https://www.paypal.com/en_US/i/scr/pixel.gif" width="1" height="1" />
                <div>
                  <span className={classes.cancel} onClick={() => setShowForm(false)}>Cancel</span>
                  <input onClick={registerDonation} className={classNames(classes.submit, {[classes.disabled]:!donationAmount})}type="submit" name="submit" title="PayPal - The safer, easier way to pay online!" alt="Donate with PayPal button" value="Submit"/>
                </div>
              </form>
            </div>}
            
          </span>
          {showForm && <div className={classes.finePrint}>
            <div>Donations are <em>NOT</em> tax deductible</div>
            {(post.coauthors?.length > 0) && <div>
              Donations are split evenly between coauthors
            </div>}
          </div>}
    </div>;
}

const PostsPageDonationButtonComponent = registerComponent('PostsPageDonationButton', PostsPageDonationButton, {styles});

declare global {
  interface ComponentTypes {
    PostsPageDonationButton: typeof PostsPageDonationButtonComponent
  }
}
