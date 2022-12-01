import React from 'react';
import { useCurrentUser } from '../common/withUser';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
});

const ReadingHistoryPage = ({classes}: {
  classes: ClassesType
}) => {
  const currentUser = useCurrentUser();
  return <div/> // TODO
}

const ReadingHistoryPageComponent = registerComponent('ReadingHistoryPage', ReadingHistoryPage, {styles});
declare global {
  interface ComponentTypes {
    ReadingHistoryPage: typeof ReadingHistoryPageComponent
  }
}
