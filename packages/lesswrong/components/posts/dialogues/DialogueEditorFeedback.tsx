import React, { Dispatch, SetStateAction, useState } from 'react';
import { getSiteUrl, registerComponent } from '../../../lib/vulcan-lib';
import Button from '@material-ui/core/Button';
import { useCurrentUser } from '../../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    backgroundColor: theme.palette.grey[60],
    padding: 20
  },
  button: {
    fontSize: 16,
    textTransform: 'none',
  },
  feedbackRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  }
});

type clickState = 'unclicked' | 'clickedAndItWorked' | 'clickedAndItDidntWork'

const feedbackButtonClicked = async (user: UsersCurrent | null, post: PostsEdit, setBeenClicked: Dispatch<SetStateAction<clickState>>) => {
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
  if (response.status === 200) setBeenClicked('clickedAndItWorked')
  else setBeenClicked('clickedAndItDidntWork')

}

export const DialogueEditorFeedback = ({ classes, post }: {
  classes: ClassesType,
  post: PostsEdit
}) => {
  const [beenClicked, setBeenClicked] = useState<clickState>('unclicked');
  const user = useCurrentUser()
  return <div className={classes.root}>
    <div className={classes.feedbackRow}>{beenClicked === 'unclicked'
      ? <Button color="primary" className={classes.button} onClick={async _ => { await feedbackButtonClicked(user, post, setBeenClicked) }}>
          Get feedback or editing help from the LessWrong team.
        </Button>
      : beenClicked === 'clickedAndItWorked'
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
