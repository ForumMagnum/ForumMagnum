import React from 'react';
import { registerComponent, Components, slugify } from '../../lib/vulcan-lib';
import classNames from 'classnames'
import { isEAForum } from '../../lib/instanceSettings';

export const sectionTitleStyle = isEAForum
  ? (theme: ThemeType): JssStyles => ({
    margin: 0,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: "14px",
    lineHeight: "21px",
    fontWeight: 700,
    letterSpacing: "0.03em",
    color: theme.palette.grey[600],
    textTransform: "uppercase",
  })
  : (theme: ThemeType): JssStyles => ({
    margin: 0,
    ...theme.typography.postStyle,
    fontSize: "2.2rem",
  });

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
  title: sectionTitleStyle(theme),
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

export type SectionTitleProps = {
  children?: React.ReactNode,
  className?: string,
  title: React.ReactNode,
  noTopMargin?: boolean,
  noBottomPadding?: boolean,
  anchor?: string,
}

// This is meant to be used as the primary section title for the central page layout (normally used in conjunction with SingleColumnSection){}
const SectionTitle = ({children, classes, className, title, noTopMargin, noBottomPadding, anchor}: SectionTitleProps & {classes: ClassesType}) => {
  return (
    <div className={classNames(classes.root, {[classes.noTopMargin]: noTopMargin, [classes.noBottomPadding]: noBottomPadding} )}>
      <Components.Typography
        id={getAnchorId(anchor, title)}
        variant='display1'
        className={classNames(classes.title, className)}
      >
        {title}
      </Components.Typography>
      <div className={classes.children}>{ children }</div>
    </div>
  )
}

const SectionTitleComponent = registerComponent('SectionTitle', SectionTitle, {styles, stylePriority: -1});

declare global {
  interface ComponentTypes {
    SectionTitle: typeof SectionTitleComponent
  }
}
