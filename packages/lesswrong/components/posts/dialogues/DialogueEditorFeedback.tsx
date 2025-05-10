import React, { useState } from 'react';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { useCurrentUser } from '../../common/withUser';
import { forumTitleSetting } from '../../../lib/instanceSettings';
import { getSiteUrl } from "../../../lib/vulcan-lib/utils";
import { registerComponent } from "../../../lib/vulcan-lib/components";

const styles = (theme: ThemeType) => ({
  root: {
    padding: 20
  },
  button: {
    fontSize: 16,
    textTransform: 'none',
    backgroundColor: theme.palette.buttons.startReadingButtonBackground,
  },
  feedbackRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  }
});

type ClickState = 'unclicked' | 'success' | 'failure'


export const DialogueEditorFeedbackInner = ({ classes, post }: {
  post: PostsEdit,
  classes: ClassesType<typeof styles>,
}) => {
  const [clickState, setClickState] = useState<ClickState>('unclicked');
  const user = useCurrentUser()

  return <div className={classes.root}>
    <div className={classes.feedbackRow}>{clickState === 'unclicked'
      ? <Button className={classes.button} onClick={async _ => { 
          // eslint-disable-next-line
          window.Intercom(
            'trackEvent',
            'requested-feedback',
            {title: post.title, _id: post._id, url: getSiteUrl() + "posts/" + post._id}
          );
          setClickState('success')
        }}>
          Get feedback or editing help from the {forumTitleSetting.get()} team.
        </Button>
      : clickState === 'success'
        ? <div>Feedback requested!</div>
        : <div>That didn't work! Refresh and try again?</div>}
    </div>
  </div>
}

export const DialogueEditorFeedback = registerComponent('DialogueEditorFeedback', DialogueEditorFeedbackInner, { styles });


