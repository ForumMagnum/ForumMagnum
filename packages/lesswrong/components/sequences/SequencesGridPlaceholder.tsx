import React from 'react';
import { Components, registerComponent } from "../../lib/vulcan-lib";

const styles = (theme: ThemeType): JssStyles => ({
})

const SequencesGridPlaceholder = ({classes}: {
  classes: ClassesType,
}) => {
  return <div/>
}

const SequencesGridPlaceholderComponent = registerComponent('SequencesGridPlaceholder', SequencesGridPlaceholder, {styles});

declare global {
  interface ComponentTypes {
    SequencesGridPlaceholder: typeof SequencesGridPlaceholderComponent
  }
}

