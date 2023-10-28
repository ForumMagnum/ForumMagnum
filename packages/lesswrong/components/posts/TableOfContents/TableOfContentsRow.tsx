import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import classNames from 'classnames';
import { isEAForum } from '../../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    position: "relative",
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
  },

  // For the highlighted section only, disable the half-opacity-on-hover effect
  // that's otherwise globally applied to <a> tags.
  highlighted: {
    '& $link': {
      color: theme.palette.link.tocLinkHighlighted,
    },
    '& $highlightDot:after': {
      content: `"•"`,
      marginLeft: 3,
      position: 'relative',
      top: 1
    },
    "& a:focus, & a:hover": {
      opacity: "initial",
    }
  },
  dense: {
    paddingTop: "0 !important",
    paddingBottom: "4px !important",
    fontSize: 12,
  },
  link: {
    display: "block",
    paddingTop: 6,
    paddingBottom: 6,
    color: theme.palette.link.tocLink,
    lineHeight: "1.2em",
    '&:hover':{
      opacity:1,
      color: theme.palette.link.tocLinkHighlighted,
    },
    ...(isEAForum && {
      lineHeight: "1.1rem",
      fontSize: "1rem",
    }),
  },
  highlightDot: {},
  // Makes sure that the start of the ToC is in line with the start of the text
  title: {
    paddingTop: 3,
    paddingBottom: theme.spacing.unit*1.5,
    borderBottom: theme.palette.border.faint,
    fontSize: isEAForum ? "1em" : undefined,
  },
  level0: {
    display:"inline-block",
    maxWidth: '100%',
    marginBottom: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    '& $link': {
      whiteSpace: "normal",
    },
    // Don't show location dot for level0
    '& $link:after': {
      content: `""`
    },
  },
  level1: {
    paddingLeft: 0,
  },
  level2: {
    fontSize:"1.1rem",
    paddingLeft: 16,
  },
  level3: {
    fontSize:"1.1rem",
    color: theme.palette.text.dim700,
    paddingLeft: 32,
  },
  level4: {
    fontSize:"1.1rem",
    color: theme.palette.text.dim700,
    paddingLeft: 48,
  },
});

const levelToClassName = (level: number, classes: ClassesType) => {
  switch(level) {
    case 0: return classes.level0;
    case 1: return classes.level1;
    case 2: return classes.level2;
    case 3: return classes.level3;
    default: return classes.level4;
  }
}

const TableOfContentsRow = ({
  indentLevel=0, highlighted=false, href, onClick, children, classes, title, divider, answer, dense
}: {
  indentLevel?: number,
  highlighted?: boolean,
  href: string,
  onClick?: (ev: any)=>void,
  children?: React.ReactNode,
  classes: ClassesType,
  title?: boolean,
  divider?: boolean,
  answer?: boolean,
  dense?: boolean,
}) => {
  if (divider) {
    return <Components.TableOfContentsDivider />
  }

  return <div
    className={classNames(
      classes.root,
      levelToClassName(indentLevel, classes),
      { [classes.highlighted]: highlighted }
    )}
  >
    <a href={href} onClick={onClick} className={classNames(classes.link, {
      [classes.title]: title,
      [classes.highlightDot]: !answer,
      [classes.dense]: dense,
    })}>
      {children}
    </a>
  </div>
}

const TableOfContentsRowComponent = registerComponent("TableOfContentsRow", TableOfContentsRow, {styles});

declare global {
  interface ComponentTypes {
    TableOfContentsRow: typeof TableOfContentsRowComponent
  }
}
