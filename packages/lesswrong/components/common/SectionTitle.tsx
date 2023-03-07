import React from 'react';
import { registerComponent, Components, slugify } from '../../lib/vulcan-lib';
import classNames from 'classnames'
import { forumSelect } from '../../lib/forumTypeUtils';
import { isEAForum } from '../../lib/instanceSettings';

export const sectionTitleStyle = (theme: ThemeType): JssStyles => (
  forumSelect({
    EAForum: {
      color: theme.palette.grey[600],
      fontSize: 16,
      lineHeight: '23px',
      fontWeight: 700,
      fontFamily: theme.typography.fontFamily,
      textTransform: 'uppercase',
      margin: 0,
    },
    default: {
      margin: 0,
      ...theme.typography.postStyle,
      fontSize: "2.2rem"
    }
  })
)

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing.unit*3,
    paddingBottom: 8
  },
  noTopMargin: {
    marginTop: 0
  },
  noBottomPadding: {
    paddingBottom: 0
  },
  title: {
    ...sectionTitleStyle(theme)
  },
  children: {
    ...theme.typography.commentStyle,
    [theme.breakpoints.down('sm')]: {
      marginRight: 8,
      marginLeft: 16,
    },
  }
})

// TODO: figure out what to do when title isn't a string. It currently returns
// undefined, which prevents anchor links from working 
export const getAnchorId = (anchor: string|undefined, title: React.ReactNode) => {
  if (anchor) {
    return anchor;
  }
  if (typeof title === 'string') {
    return slugify(title);
  }
}

// This is meant to be used as the primary section title for the central page layout (normally used in conjunction with SingleColumnSection){}
const SectionTitle = ({children, classes, className, title, noTopMargin, noBottomPadding, anchor}: {
  children?: React.ReactNode,
  classes: ClassesType,
  className?: string,
  title: React.ReactNode,
  noTopMargin?: boolean,
  noBottomPadding?: boolean,
  anchor?: string,
}) => {
  return (
    <div className={classNames(classes.root, {[classes.noTopMargin]: noTopMargin, [classes.noBottomPadding]: noBottomPadding} )}>
      {isEAForum ? <h1 id={getAnchorId(anchor, title)} className={classNames(classes.title, className)}>
        {title}
      </h1> : <Components.Typography
        id={getAnchorId(anchor, title)}
        variant='display1'
        className={classNames(classes.title, className)}
      >
        {title}
      </Components.Typography>}
      <div className={classes.children}>{ children }</div>
    </div>
  )
}

const SectionTitleComponent = registerComponent('SectionTitle', SectionTitle, {styles});

declare global {
  interface ComponentTypes {
    SectionTitle: typeof SectionTitleComponent
  }
}
