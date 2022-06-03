import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles =>  ({
  root: {
  }
})

const PollResultsDisplay = ({classes}: {
  classes: ClassesType
}) => {
  return <div></div>
}

const PollResultsDisplayComponent = registerComponent('PollResultsDisplay', PollResultsDisplay, { styles });

declare global {
  interface ComponentTypes {
    PollResultsDisplay: typeof PollResultsDisplayComponent
  }
}