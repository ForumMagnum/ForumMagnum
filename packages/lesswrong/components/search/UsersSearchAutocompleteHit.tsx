import {Components, registerComponent} from '../../lib/vulcan-lib'
import React from 'react'
import {styles as metaInfo} from '../common/MetaInfo'
import { showKarmaSetting } from '../../lib/publicSettings'

const specificityFmClass = 'forum-magnum'
const specificityCkClass = 'ck-override'
const styles = (theme: ThemeType): JssStyles => ({
  userHitLabel: {
    // A specificity hack to work around https://github.com/ckeditor/ckeditor5/issues/3424
    [`&.${specificityFmClass}.${specificityCkClass}, &.${specificityFmClass}.${specificityCkClass} *`]: {
      ...theme.typography.body2,
      ...metaInfo(theme).root,
      marginLeft: theme.spacing.unit,
    },
  },
})


interface UsersSearchAutocompleteHitProps {
  classes: ClassesType
  name: string
  createdAt: Date
  karma?: number
}

const UsersSearchAutocompleteHit = (props: UsersSearchAutocompleteHitProps) => {
  const {MetaInfo, FormatDate} = Components

  const metaClassName = `${props.classes.userHitLabel} ${specificityFmClass} ${specificityCkClass}`
  return <span>
    {props.name}
    <MetaInfo className={metaClassName}>
      <FormatDate date={props.createdAt} tooltip={false} />
    </MetaInfo>
    {showKarmaSetting.get() && <MetaInfo className={metaClassName}>
      {props.karma || 0} karma
    </MetaInfo>}
  </span>
}

const UsersSearchHitLabelComponent = registerComponent('UsersSearchAutocompleteHit', UsersSearchAutocompleteHit, {styles})

declare global {
  interface ComponentTypes {
    UsersSearchAutocompleteHit: typeof UsersSearchHitLabelComponent
  }
}
