import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles =>  ({
  root: {
  }
})

const PollQuestionDisplay = ({pollQuestion, classes}: {
  pollQuestion: PollsBase,
  classes: ClassesType
}) => {
  return <div></div>
}

const PollQuestionDisplayComponent = registerComponent('PollQuestionDisplay', PollQuestionDisplay, { styles });

declare global {
  interface ComponentTypes {
    PollQuestionDisplay: typeof PollQuestionDisplayComponent
  }
}