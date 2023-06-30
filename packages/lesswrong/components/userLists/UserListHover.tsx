import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Paper } from '@material-ui/core';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    padding: 20,
  },
  title: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 20,
    marginBottom: 10,
  },
  members: {
    marginTop: 10,
  },
})

const UserListHover = ({list, classes}: {
  list: UserListFragment,
  classes: ClassesType,
}) => {
  const { ContentStyles, ContentItemBody, UsersNameDisplay } = Components
  
  return <Paper className={classes.root}>
    <div className={classes.title}>{list.name}</div>
    <ContentStyles contentType="comment">
      <ContentItemBody dangerouslySetInnerHTML={{__html: list.description?.html ?? ''}}/>
    </ContentStyles>
    <div className={classes.members}>
      {list.members.map((user, i) => <>
        {i > 0 && ', '}
        <UsersNameDisplay user={user}/>
      </>)}
    </div>
  </Paper>
}

const UserListHoverComponent = registerComponent('UserListHover', UserListHover, {styles});

declare global {
  interface ComponentTypes {
    UserListHover: typeof UserListHoverComponent
  }
}

