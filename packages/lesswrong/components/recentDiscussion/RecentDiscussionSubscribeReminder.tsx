import React, {useState, useEffect, useRef} from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { getUserEmail, userEmailAddressIsVerified, userHasEmailAddress} from '../../lib/collections/users/helpers';
import { useMessages } from '../common/withMessages';
import { getGraphQLErrorID, getGraphQLErrorMessage } from '../../lib/utils/errorUtil';
import { randInt } from '../../lib/random';
import SimpleSchema from 'simpl-schema';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import Input from '@/lib/vendor/@material-ui/core/src/Input';
import MailOutline from '@/lib/vendor/@material-ui/icons/src/MailOutline'
import CheckRounded from '@/lib/vendor/@material-ui/icons/src/CheckRounded'
import withErrorBoundary from '../common/withErrorBoundary'
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { forumTitleSetting, forumTypeSetting, isAF, isEAForum, isLW, isLWorAF } from '../../lib/instanceSettings';
import TextField from '@/lib/vendor/@material-ui/core/src/TextField';
import { isFriendlyUI } from '../../themes/forumTheme';
import { LoginForm } from "../users/LoginForm";
import { SignupSubscribeToCurated } from "../users/SignupSubscribeToCurated";
import { Loading } from "../vulcan-core/Loading";
import { AnalyticsInViewTracker } from "../common/AnalyticsInViewTracker";

// mailchimp link to sign up for the EA Forum's digest
export const eaForumDigestSubscribeURL = "https://effectivealtruism.us8.list-manage.com/subscribe/post?u=52b028e7f799cca137ef74763&amp;id=7457c7ff3e&amp;f_id=0086c5e1f0"

const styles = (theme: ThemeType) => ({
  root: {
    marginBottom: theme.spacing.unit*4,
    position: "relative",
    backgroundColor: isFriendlyUI
      ? theme.palette.grey[0]
      : theme.palette.panelBackground.recentDiscussionThread,
    border: isFriendlyUI ? `1px solid ${theme.palette.grey[200]}` : undefined,

    padding: 16,
    ...theme.typography.body2,
    boxShadow: theme.palette.boxShadow.default,
    borderRadius: theme.borderRadius.default,

    marginLeft: "auto",
    marginRight: "auto",
    maxWidth: 500,
  },
  adminNotice: {
    textAlign: "left",
    marginTop: 22,
    fontSize: 12,
    lineHeight: 1.3,
    fontStyle: "italic",
  },
  loginForm: {
    margin: "0 auto -4px",
    maxWidth: 252,
  },
  digestForm: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: 30,
    rowGap: '14px',
    padding: '20px 50px 20px 20px',
    [theme.breakpoints.down('xs')]: {
      padding: 10
    }
  },
  digestFormInput: {
    flexGrow: 1
  },
  digestFormSubmitBtn: {
    minHeight: 0,
    boxShadow: 'none'
  },
  message: {
    display: "flex",
    alignItems: "flex-start",
    fontSize: 18,
    lineHeight: 1.75,
  },
  messageDescription: {
    fontSize: 12,
    marginTop: 8
  },
  mailIcon: {
    color: theme.palette.primary.main,
    marginTop: 4,
    marginRight: 12
  },
  checkIcon: {
    color: theme.palette.icon.greenCheckmark,
    marginTop: 4,
    marginRight: 12
  },
  emailInput: {
    marginTop: 18
  },
  subscribeButton: {
    margin: "18px auto 0",
    display: "block",
    background: theme.palette.primary.main,
    color: theme.palette.buttons.recentDiscussionSubscribeButtonText,
    fontSize: 15
  },
  buttons: {
    marginTop: 16,
    textAlign: "right",
  },
  maybeLaterButton: {
  },
  dontAskAgainButton: {
  },
});

/**
 * This is the ad that appears in "Recent discussion".
 * For LW it's for the Curated email, and for EA Forum it's for the Forum Digest.
 *
 * It has some overlap with the Forum Digest ad that appears on the EA Forum home rhs.
 * In particular, both components use currentUser.hideSubscribePoke,
 * so for logged in users, hiding one ad hides the other.
 *
 * See EAHomeRightHandSide.tsx for the other component.
 */
const RecentDiscussionSubscribeReminderInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const [hide, setHide] = useState(false);
  const [subscribeChecked, setSubscribeChecked] = useState(true);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [subscriptionConfirmed, setSubscriptionConfirmed] = useState(false);
  const emailAddressInput = useRef<HTMLInputElement|null>(null);
  const [loading, setLoading] = useState(false);
  const { flash } = useMessages();
  const subscriptionDescription = '(2-3 posts per week, selected by the LessWrong moderation team.)';
  const { captureEvent } = useTracking({eventProps: {pageElementContext: "subscribeReminder"}});
  
  // Show admins a random version of the widget. Makes sure we notice if it's intrusive/bad.
  const [adminBranch, setAdminBranch] = useState(-1);
  const adminUiMessage = currentUser?.isAdmin ? <div className={classes.adminNotice}>
    You are seeing this UI element because you're an admin. Admins are shown a random version of the
    subscribe-reminder even if they're already subscribed, to make sure it still works and isn't
    annoying.
  </div>: null
  
  useEffect(() => {
    if (adminBranch === -1 && currentUser?.isAdmin) {
      // EA Forum only has 4 branches, LW has 5. Fortunately LW's extra branch
      // is the last one, so we can exclude it easily.
      setAdminBranch(randInt(!isLWorAF ? 4 : 5));
    }
  }, [adminBranch, currentUser?.isAdmin]);

  // disable on AlignmentForum
  if (isAF) {
    return null;
  }

  // Placeholder to prevent SSR mismatch, changed on load.
  if (adminBranch === -1 && currentUser?.isAdmin)
    return <div/>

  // adjust functionality based on forum type
  let currentUserSubscribed
  if (isLW) {
    currentUserSubscribed = currentUser?.emailSubscribedToCurated;
  } else {
    currentUserSubscribed = currentUser?.subscribedToDigest;
  }

  const maybeLaterButton = <Button
    className={classes.maybeLaterButton}
    onClick={() => {
      setHide(true)
      captureEvent("subscribeReminderButtonClicked",{buttonType: "maybeLaterButton"})
    }}
  >
    Maybe Later
  </Button>
  
  const dontAskAgainButton = <span>
    {currentUser && <Button
      className={classes.dontAskAgainButton}
      onClick={() => {
        void updateCurrentUser({hideSubscribePoke: true});
        setHide(true)
        captureEvent("subscribeReminderButtonClicked",{buttonType: "dontAskAgainButton"})
      }}
    >
      Don't Ask Again
    </Button>}
  </span>
  
  if (hide || currentUser?.hideSubscribePoke) {
    return null;
  }
  
  const updateAndMaybeVerifyEmail = async () => {
    setLoading(true);
    // subscribe to different emails based on forum type
    const userSubscriptionData: UpdateUserDataInput = isLW ?
    {emailSubscribedToCurated: true} : {subscribedToDigest: true};
    // since they chose to subscribe to an email, make sure this is false
    userSubscriptionData.unsubscribeFromAll = false;

    if (!userEmailAddressIsVerified(currentUser)) {
      userSubscriptionData.whenConfirmationEmailSent = new Date();
    }

    try {
      await updateCurrentUser(userSubscriptionData);
      setSubscriptionConfirmed(true);
    } catch(e) {
      flash(getGraphQLErrorMessage(e));
    }

    setLoading(false);
  }
  
  // FIXME: Unstable component will lose state on rerender
  // eslint-disable-next-line react/no-unstable-nested-components
  const AnalyticsWrapper = ({children, branch}: {children: React.ReactNode, branch: string}) => {
    return <AnalyticsContext pageElementContext="subscribeReminder" branch={branch}>
      <AnalyticsInViewTracker eventProps={{inViewType: "subscribeReminder"}}>
        <div className={classes.root}>
          {children}
        </div>
      </AnalyticsInViewTracker>
    </AnalyticsContext>
  }
  
  // the EA Forum uses this prompt in most cases
  const eaForumSubscribePrompt = (
    <>
      <div className={classes.message}>
        <MailOutline className={classes.mailIcon} />
        Sign up for the Forum's email digest
      </div>
      <div className={classes.messageDescription}>
        You'll get a weekly email with the best posts from the past week.
        The Forum team selects the posts to feature based on personal preference
        and Forum popularity, and also adds some announcements and a classic post.
      </div>
    </>
  );
  
  if (loading) {
    return <div className={classes.root}>
      <Loading/>
    </div>
  } else if (subscriptionConfirmed) {
    // Show the confirmation after the user subscribes
    let confirmText;
    if (isLW) {
      confirmText = "You are subscribed to the best posts of LessWrong!";
    } else {
      confirmText = `You are subscribed to the ${forumTitleSetting} Digest`;
    }
    return <AnalyticsWrapper branch="already-subscribed">
      <div className={classes.message}>
        <CheckRounded className={classes.checkIcon} />
        {confirmText}
      </div>
    </AnalyticsWrapper>
  } else if (verificationEmailSent) {
    // Clicked Subscribe in one of the other branches, and a confirmation email
    // was sent. You need to verify your email address to complete the subscription.
    const yourEmail = currentUser && getUserEmail(currentUser)
    return <AnalyticsWrapper branch="needs-email-verification-subscribed-in-other-branch">
      <div className={classes.message}>
        We sent an email to {yourEmail}. Follow the link in the email to complete your subscription.
      </div>
    </AnalyticsWrapper>
  } else if (!currentUser || adminBranch===0) {
    // Not logged in. Show a create-account form and a brief pitch.
    const subscribeTextNode = isEAForum ? eaForumSubscribePrompt : (
      <div className={classes.message}>
        To get the best posts emailed to you, create an account! {subscriptionDescription}
      </div>
    );
    return <AnalyticsWrapper branch="logged-out">
      {subscribeTextNode}
      {isEAForum ? <form action={eaForumDigestSubscribeURL} method="post" className={classes.digestForm}>
        <TextField label="Email address" name="EMAIL" required className={classes.digestFormInput} />
        <Button variant="contained" type="submit" color="primary" className={classes.digestFormSubmitBtn}>
          Sign up
        </Button>
      </form> : <div className={classes.loginForm}>
        <LoginForm startingState="signup" />
      </div>}
      {adminUiMessage}
    </AnalyticsWrapper>
  } else if (!userHasEmailAddress(currentUser) || adminBranch===1) {
    const emailType = isEAForum ? 'our weekly digest email' : 'curated posts';
    // Logged in, but no email address associated. Probably a legacy account.
    // Show a text box for an email address, with a submit button and a subscribe
    // checkbox.
    return <AnalyticsWrapper branch="missing-email">
      <div className={classes.message}>
        Your account does not have an email address associated. Add an email address to subscribe to {emailType} and enable notifications.
      </div>
      
      <Input placeholder="Email address" inputRef={emailAddressInput} className={classes.emailInput} />
      <SignupSubscribeToCurated defaultValue={true} onChange={(checked: boolean) => setSubscribeChecked(true)}/>
      
      <div className={classes.buttons}>
        <Button className={classes.subscribeButton} onClick={async (ev) => {
          const emailAddress = emailAddressInput.current;
          if (emailAddress && SimpleSchema.RegEx.Email.test(emailAddress?.value)) {
            setLoading(true);
            try {
              // subscribe to different emails based on forum type
              const userSubscriptionData: UpdateUserDataInput = isEAForum ?
                {subscribedToDigest: subscribeChecked} : {emailSubscribedToCurated: subscribeChecked};
              userSubscriptionData.email = emailAddress?.value;
              userSubscriptionData.unsubscribeFromAll = false;
              await updateCurrentUser(userSubscriptionData);

              if (!userEmailAddressIsVerified(currentUser)) {
                // Confirmation-email mutation is separate from the send-verification-email
                // mutation because otherwise it goes to the old email address (aka null)
                await updateCurrentUser({
                  whenConfirmationEmailSent: new Date(),
                });
              }
              setSubscriptionConfirmed(true);
            } catch(e) {
              if (getGraphQLErrorID(e) === "users.email_already_taken") {
                flash("That email address is already taken by a different account.");
              } else {
                flash(e.message || e.id);
              }
            }
            setLoading(false);
          } else {
            flash("Please enter a valid email address.");
          }
          captureEvent("subscribeReminderButtonClicked", {buttonType: "subscribeButton"});
        }}>Submit</Button>
        {adminUiMessage}
        <div className={classes.buttons}>
          {maybeLaterButton}
          {dontAskAgainButton}
        </div>
      </div>
    </AnalyticsWrapper>
  } else if (currentUser.unsubscribeFromAll || adminBranch===2) {
    // User has clicked unsubscribe-from-all at some point in the past. Pitch
    // on re-subscribing. A big Subscribe button, which clears the
    // unsubscribe-from-all option, activates curation emails (if not already
    // activated), and sends a confirmation email (if needed).
    const subscribeTextNode = forumTypeSetting.get() === 'EAForum' ? eaForumSubscribePrompt : (
      <div className={classes.message}>
        You previously unsubscribed from all emails from LessWrong.
        Re-subscribe to get the best posts emailed to you! {subscriptionDescription}
      </div>
    );
    return <AnalyticsWrapper branch="previously-unsubscribed">
      {subscribeTextNode}
      <Button className={classes.subscribeButton} onClick={async (ev) => {
        await updateAndMaybeVerifyEmail();
        captureEvent("subscribeReminderButtonClicked", {buttonType: "subscribeButton"});
      }}>Subscribe</Button>
      {adminUiMessage}
      <div className={classes.buttons}>
        {maybeLaterButton}
        {dontAskAgainButton}
      </div>
    </AnalyticsWrapper>
  } else if (!currentUserSubscribed || adminBranch===3) {
    // User is logged in, and has an email address associated with their
    // account, but is not subscribed to curated posts. A Subscribe button which
    // sets the subscribe-to-curated option, and (if their email address isn't
    // verified) resends the verification email.
    const subscribeTextNode = forumTypeSetting.get() === 'EAForum' ? eaForumSubscribePrompt : (
      <div className={classes.message}>
        Subscribe to get the best of LessWrong emailed to you. {subscriptionDescription}
      </div>
    );
    return <AnalyticsWrapper branch="logged-in-not-subscribed">
      {subscribeTextNode}
      <Button className={classes.subscribeButton} onClick={async (ev) => {
        await updateAndMaybeVerifyEmail();
        captureEvent("subscribeReminderButtonClicked", {buttonType: "subscribeButton"});
      }}>Subscribe</Button>
      {adminUiMessage}
      <div className={classes.buttons}>
        {maybeLaterButton}
        {dontAskAgainButton}
      </div>
    </AnalyticsWrapper>

  } else if (!userEmailAddressIsVerified(currentUser) || adminBranch===4) {
    // User is subscribed, but they haven't verified their email address. Show
    // a resend-verification-email button.
    return <AnalyticsWrapper branch="needs-email-verification">
      <div>
        <div className={classes.message}>
          Please verify your email address to activate your subscription to curated posts.
        </div>
        <div className={classes.buttons}>
          <Button className={classes.subscribeButton} onClick={async (ev) => {
            setLoading(true);
            try {
              await updateCurrentUser({
                whenConfirmationEmailSent: new Date()
              });
            } catch(e) {
              flash(getGraphQLErrorMessage(e));
            }
            setLoading(false);
            setVerificationEmailSent(true);
            captureEvent("subscribeReminderButtonClicked", {buttonType: "resendVerificationEmailButton"});
          }}>Resend Verification Email</Button>
          {adminUiMessage}
          <div className={classes.buttons}>
            {maybeLaterButton}
            {dontAskAgainButton}
          </div>
        </div>
      </div>
    </AnalyticsWrapper>
  } else {
    // Everything looks good-already subscribed to curated. No need to show anything.
    return null;
  }
}

export const RecentDiscussionSubscribeReminder = registerComponent(
  'RecentDiscussionSubscribeReminder', RecentDiscussionSubscribeReminderInner, {
    styles,
    hocs: [withErrorBoundary],
  }
);


