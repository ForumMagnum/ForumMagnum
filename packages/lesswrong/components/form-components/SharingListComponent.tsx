import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
})

const SharingListComponent = ({classes}: {
  classes: ClassesType,
}) => {
  return <div/>
}

const SharingListComponentComponent = registerComponent('SharingListComponent', SharingListComponent, {styles});

declare global {
  interface ComponentTypes {
    SharingListComponent: typeof SharingListComponentComponent
  }
}

