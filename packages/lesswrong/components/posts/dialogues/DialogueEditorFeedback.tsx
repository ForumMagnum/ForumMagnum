import React, { Dispatch, SetStateAction, useState } from 'react';
import { getSiteUrl, registerComponent } from '../../../lib/vulcan-lib';
import Button from '@material-ui/core/Button';
import { useCurrentUser } from '../../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
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


export const DialogueEditorFeedback = ({ classes, post }: {
  classes: ClassesType,
  post: PostsEdit
}) => {
  const [clickState, setClickState] = useState<ClickState>('unclicked');
  const user = useCurrentUser()

  const feedbackButtonClicked = async () => {
    const data = { title: post.title,
      id: post._id,
      url: getSiteUrl() + "posts/" + post._id,
      coauthors: post.coauthors.map(c => c.displayName).join(', '),
      author: post.user?.displayName,
      requester: user?.displayName
    }
    const response = await fetch('https://hooks.slack.com/triggers/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', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (response.status === 200) setClickState('success')
    else setClickState('failure')
  
  }

  return <div className={classes.root}>
    <div className={classes.feedbackRow}>{clickState === 'unclicked'
      ? <Button className={classes.button} onClick={async _ => { await feedbackButtonClicked() }}>
          Get feedback or editing help from the LessWrong team.
        </Button>
      : clickState === 'success'
        ? <div>Feedback requested!</div>
        : <div>That didn't work! Refresh and try again?</div>}
    </div>
  </div>
}

const DialogueEditorFeedbackComponent = registerComponent('DialogueEditorFeedback', DialogueEditorFeedback, { styles });

declare global {
  interface ComponentTypes {
    DialogueEditorFeedback: typeof DialogueEditorFeedbackComponent
  }
}
