import React, { Component } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { withUpdateCurrentUser, WithUpdateCurrentUserProps } from '../hooks/useUpdateCurrentUser';
import { getUserEmail, userEmailAddressIsVerified} from '../../lib/collections/users/helpers';
import { rssTermsToUrl } from "../../lib/rss_urls";
import { CopyToClipboard } from 'react-copy-to-clipboard';
import TextField from '@/lib/vendor/@material-ui/core/src/TextField';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { DialogActions } from '../widgets/DialogActions';
import { DialogContent } from '../widgets/DialogContent';
import { DialogContentText } from '../widgets/DialogContentText';
import Radio from '@/lib/vendor/@material-ui/core/src/Radio';
import RadioGroup from '@/lib/vendor/@material-ui/core/src/RadioGroup';
import FormControlLabel from '@/lib/vendor/@material-ui/core/src/FormControlLabel';
import FormControl from '@/lib/vendor/@material-ui/core/src/FormControl';
import InputLabel from '@/lib/vendor/@material-ui/core/src/InputLabel';
import Select from '@/lib/vendor/@material-ui/core/src/Select';
import withMobileDialog from '@/lib/vendor/@material-ui/core/src/withMobileDialog';
import withUser from '../common/withUser';
import { withTracking } from "../../lib/analyticsEvents";
import { isEAForum, isLWorAF } from '../../lib/instanceSettings';
import Tabs from '@/lib/vendor/@material-ui/core/src/Tabs';
import Tab from '@/lib/vendor/@material-ui/core/src/Tab';
import { preferredHeadingCase } from '../../themes/forumTheme';
import { forumSelect } from '../../lib/forumTypeUtils';


const styles = (theme: ThemeType) => ({
  thresholdSelector: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-evenly"
  },
  estimate: {
    maxWidth: "500px"
  },
  content: {
    padding: `0 ${theme.spacing.unit * 3}px`,
    "& .MuiTypography-root": {
      color: theme.palette.text.normal,
    },
  },
  tabbar: {
    marginBottom: theme.spacing.unit * 3
  },
  viewSelector: {
    width: "100%",
    marginBottom: theme.spacing.unit * 2
  },
  RSSLink: {
    marginTop: theme.spacing.unit * 2
  },
  errorMsg: {
    color: theme.palette.text.error,
  },
  link: {
    textDecoration: "underline"
  },
});

const thresholds = forumSelect({
  LessWrong: [2, 30, 45, 75, 125],
  AlignmentForum: [2, 30, 45],
  EAForum: [2, 30, 75, 125, 200],
  // We default you off pretty low, you can add more once you get more high
  // karma posts
  default: [2, 30, 45, 75]
})

/**
 * Calculated based on the average number of words posted per post on LW2 as of
 * August 2018.
 */
function timePerWeekFromPosts(posts: number) {
  const minutes = posts * 11
  if (minutes < 60) {
    return `${minutes} minutes`
  }
  return `${Math.round(minutes / 60)} hours`
}

/** Posts per week as of May 2022 */
const postsPerWeek = forumSelect<Record<string, number>>({
  EAForum: {
    '2': 119,
    '30': 24,
    '45': 20,
    '75': 10,
    '125': 4,
    '200': 1,
  },
  // (JP) I eyeballed these, you could query your db for better numbers
  LessWrong: {
    '2': 80,
    '30': 16,
    '45': 13,
    '75': 7,
    '125': 2,
  },
  AlignmentForum: {
    '2': 10,
    '30': 2,
    '45': 1,
  },
  default: {
    '2': 40,
    '30': 7,
    '45': 2,
    '75': 1,
  }
});

const viewNames = {
  'frontpage': 'Frontpage',
  'curated': 'Curated Content',
  'community': 'All Posts',
  'pending': 'pending posts',
  'rejected': 'rejected posts',
  'scheduled': 'scheduled posts',
  'all_drafts': 'all drafts',
}

interface ExternalProps {
  method: any,
  view: any,
  fullScreen?: boolean,
  onClose: any,
  open: boolean,
}
interface SubscribeDialogProps extends ExternalProps, WithUserProps, WithStylesProps, WithTrackingProps, WithUpdateCurrentUserProps {
}

interface SubscribeDialogState {
  view:  keyof typeof viewNames,
  method:  string,
  threshold: string,
  copiedRSSLink: boolean,
  subscribedByEmail: boolean,
}

type EventWithSelectTarget = {
  target: {
    select: Function
  }
};

class SubscribeDialog extends Component<SubscribeDialogProps,SubscribeDialogState> {
  constructor(props: SubscribeDialogProps) {
    super(props);
    this.state = {
      threshold: "30",
      method: this.props.method,
      copiedRSSLink: false,
      subscribedByEmail: false,
      
      view: (this.props.method === "email" && !this.emailFeedExists(this.props.view)) ? "curated" : this.props.view,
    };
  }

  rssTerms() {
    const view = this.state.view;
    let terms: any = { view: `${view}-rss` };
    if (view === "community" || view === "frontpage") terms.karmaThreshold = this.state.threshold;
    return terms;
  }

  // FIXME: Not clear that this actually works for both onClick and onFocus!
  autoselectRSSLink(event: any) {
    event.target && 'select' in event.target && event.target.select();
  }

  subscribeByEmail() {
    let mutation: Partial<DbUser> = { emailSubscribedToCurated: true }
    const { currentUser, updateCurrentUser, captureEvent } = this.props;
    if (!currentUser) return;

    if (!userEmailAddressIsVerified(currentUser)) {
      // Combine mutations into a single update call.
      // (This reduces the number of server-side callback
      // invocations. In a past version this worked around
      // a bug, now it's just a performance optimization.)
      mutation = {...mutation, whenConfirmationEmailSent: new Date()};
    }

    void updateCurrentUser(mutation)

    this.setState({ subscribedByEmail: true });
    captureEvent("subscribedByEmail")
  }

  emailSubscriptionEnabled() {
    return this.props.currentUser && getUserEmail(this.props.currentUser) 
  }

  emailFeedExists(view: string) {
    if (view === "curated") return true;
    return false;
  }

  isAlreadySubscribed() {
    if (this.state.view === "curated"
        && this.props.currentUser
        && this.props.currentUser.emailSubscribedToCurated)
      return true;
    return false;
  }

  selectMethod(method: string) {
    this.setState({
      copiedRSSLink: false,
      subscribedByEmail: false,
      method
    })
  }

  selectThreshold(threshold: string) {
    this.setState({
      copiedRSSLink: false,
      subscribedByEmail: false,
      threshold
    })
  }


  selectView(view: keyof typeof viewNames) {
    this.setState({
      copiedRSSLink: false,
      subscribedByEmail: false,
      view
    })
  }

  render() {
    const { classes, fullScreen, onClose, open, currentUser } = this.props;
    const { view, threshold, method, copiedRSSLink, subscribedByEmail } = this.state;
    const { LWDialog, MenuItem } = Components;

    const viewSelector = <FormControl key="viewSelector" className={classes.viewSelector}>
      <InputLabel htmlFor="subscribe-dialog-view">Feed</InputLabel>
      <Select
        value={view}
        onChange={ event => this.selectView(event.target.value as keyof typeof viewNames) }
        disabled={method === "email" && !currentUser}
        inputProps={{ id: "subscribe-dialog-view" }}
      >
        {/* TODO: Forum digest */}
        <MenuItem value="curated">Curated</MenuItem>
        <MenuItem value="frontpage" disabled={method === "email"}>Frontpage</MenuItem>
        <MenuItem value="community" disabled={method === "email"}>{preferredHeadingCase("All Posts")}</MenuItem>
      </Select>
    </FormControl>

    return (
      <LWDialog
        fullScreen={fullScreen}
        open={open}
        onClose={onClose}
      >
        {isLWorAF && <Tabs
          value={method}
          indicatorColor="primary"
          textColor="primary"
          onChange={ (event, value) => this.selectMethod(value) }
          className={classes.tabbar}
          fullWidth
        >
          <Tab label="RSS" key="tabRSS" value="rss" />
          <Tab label="Email" key="tabEmail" value="email" />
        </Tabs>}

        <DialogContent className={classes.content}>
          { method === "rss" && <React.Fragment>
            {viewSelector}

            {(view === "community" || view === "frontpage") && <div>
              <DialogContentText>Generate a RSS link to posts in {viewNames[view]} of this karma and above.</DialogContentText>
              <RadioGroup
                value={threshold}
                onChange={ (event, value) => this.selectThreshold(value) }
                className={classes.thresholdSelector}
              >
                { thresholds.map((t: AnyBecauseTodo) => t.toString()).map((threshold: AnyBecauseTodo) =>
                  <FormControlLabel
                    control={<Radio />}
                    label={threshold}
                    value={threshold}
                    key={`labelKarmaThreshold${threshold}`}
                    className={classes.thresholdButton}
                  />
                ) }
              </RadioGroup>
              <DialogContentText className={classes.estimate}>
                That's roughly { postsPerWeek[threshold] } posts per week
                ({ timePerWeekFromPosts(postsPerWeek[threshold]) } of reading)
              </DialogContentText>
            </div>}

            <TextField
              className={classes.RSSLink}
              label="RSS Link"
              onFocus={this.autoselectRSSLink}
              onClick={this.autoselectRSSLink}
              value={rssTermsToUrl(this.rssTerms())}
              key="rssLinkTextField"
              fullWidth />
          </React.Fragment> }

          { method === "email" && [
            viewSelector,
            !!currentUser ? (
              [
                !this.emailFeedExists(view) && <DialogContentText key="dialogNoFeed" className={classes.errorMsg}>
                  Sorry, there's currently no email feed for {viewNames[view]}.
                </DialogContentText>,
                subscribedByEmail && !userEmailAddressIsVerified(currentUser) && !isEAForum && <DialogContentText key="dialogCheckForVerification" className={classes.infoMsg}>
                  We need to confirm your email address. We sent a link to {getUserEmail(currentUser)}; click the link to activate your subscription.
                </DialogContentText>
              ]
            ) : (
              <DialogContentText key="dialogPleaseLogIn" className={classes.errorMsg}>
                You need to <a className={classes.link} href="/login">log in</a> to subscribe via Email
              </DialogContentText>
            )
          ] }
        </DialogContent>
        <DialogActions>
          { method === "rss" &&
            <CopyToClipboard
              text={rssTermsToUrl(this.rssTerms())}
              onCopy={ (text, result) => {
                this.setState({ copiedRSSLink: result })
                this.props.captureEvent("rssLinkCopied")
              }}
            >
              <Button color="primary">{copiedRSSLink ? "Copied!" : "Copy Link"}</Button>
            </CopyToClipboard> }
          { method === "email" &&
            (this.isAlreadySubscribed()
              ? <Button color="primary" disabled={true}>
                  You are already subscribed to this feed.
                </Button>
              : <Button
                  color="primary"
                  onClick={ () => this.subscribeByEmail() }
                  disabled={!this.emailFeedExists(view) || subscribedByEmail || !currentUser}
                >{subscribedByEmail ? "Subscribed!" : "Subscribe to Feed"}</Button>
            )
          }
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </LWDialog>
    );
  }
}

const SubscribeDialogComponent = registerComponent<ExternalProps>("SubscribeDialog", SubscribeDialog, {
  styles,
  hocs: [
    withMobileDialog(),
    withUser,
    withUpdateCurrentUser,
    withTracking,
  ]
});

declare global {
  interface ComponentTypes {
    SubscribeDialog: typeof SubscribeDialogComponent
  }
}
