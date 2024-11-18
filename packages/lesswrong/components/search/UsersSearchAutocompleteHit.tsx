import {Components, registerComponent} from '../../lib/vulcan-lib'
import React from 'react'
import {styles as metaInfo} from '../common/MetaInfo'

const styles = (theme: ThemeType): JssStyles => ({
  userHitLabel: {
    ...theme.typography.body2,
    ...metaInfo(theme).root,
    marginLeft: theme.spacing.unit,

    // To properly switch color on item being selected
    [`.ck-on &`]: {
      color: 'inherit',
    },
  },
  
  root: {
    color: 'inherit',
  },
})

const UsersSearchAutocompleteHit = ({hit, classes}: {
  hit: SearchUser
  classes: ClassesType
}) => {
  const {MetaInfo, FormatDate} = Components

  return <span className={classes.root}>
    {hit.displayName}
    <MetaInfo className={classes.userHitLabel}>
      <FormatDate date={hit.createdAt} tooltip={false}/>
    </MetaInfo>
    <MetaInfo className={classes.userHitLabel}>
      {hit.karma || 0} karma
    </MetaInfo>
  </span>
}

const UsersSearchHitLabelComponent = registerComponent('UsersSearchAutocompleteHit', UsersSearchAutocompleteHit, {styles})

declare global {
  interface ComponentTypes {
    UsersSearchAutocompleteHit: typeof UsersSearchHitLabelComponent
  }
}
