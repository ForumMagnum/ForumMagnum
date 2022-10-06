import React, { useState } from 'react';
import { Components, registerComponent } from '../../../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginTop: 20
  },
  btn: {
    fontFamily: theme.typography.fontFamily,
    background: 'none',
    color: theme.palette.grey[500],
    fontSize: 12,
    padding: 0,
    marginLeft: 5,
    '&:hover': {
      opacity: 0.5
    },
  }
})

const MAX_TAGS = 4

const EAUsersProfileTags = ({tags, classes}: {
  tags: Array<TagBasicInfo>,
  classes: ClassesType,
}) => {
  const [collapsed, setCollapsed] = useState(true)

  const { FooterTag } = Components
  
  if (!tags.length) return null
  
  // we only show up to 4 tags by default
  const meritsCollapse = tags.length > MAX_TAGS
  const visibleTags = (meritsCollapse && collapsed) ? tags.slice(0, MAX_TAGS) : tags
  
  return (
    <div className={classes.root}>
      {visibleTags.map(tag => <FooterTag key={tag._id} tag={{...tag, core: false}} />)}
      {meritsCollapse && <button onClick={() => setCollapsed(!collapsed)} className={classes.btn}>
        {collapsed ? `${tags.length - MAX_TAGS} more` : 'Show less'}
      </button>}
    </div>
  )
}

const EAUsersProfileTagsComponent = registerComponent(
  'EAUsersProfileTags', EAUsersProfileTags, {styles}
);

declare global {
  interface ComponentTypes {
    EAUsersProfileTags: typeof EAUsersProfileTagsComponent
  }
}
