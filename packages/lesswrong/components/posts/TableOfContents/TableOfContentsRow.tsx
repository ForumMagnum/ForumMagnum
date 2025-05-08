import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import classNames from 'classnames';
import { isBookUI, isFriendlyUI } from '../../../themes/forumTheme';
import { fullHeightToCEnabled } from '../../../lib/betas';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const sectionOffsetStyling = (fullHeightToCEnabled ? {
  display: 'flex',
  flexDirection: 'column-reverse',
} : {});

const styles = defineStyles("TableOfContentsRow", (theme: ThemeType) => ({
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
      content: isBookUI ? null : `"•"`,
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
    lineHeight: fullHeightToCEnabled ? "1em" : "1.2em",
    '&:hover':{
      color: theme.palette.link.tocLinkHighlighted,
      opacity: isFriendlyUI ? 1 : undefined
    },
    ...(isFriendlyUI && {
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
    fontSize: isFriendlyUI ? "1em" : undefined,
    '&:hover': {
      opacity: "unset"
    }
  },
  level0: {
    display:"block",
    maxWidth: '100%',
    marginBottom: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    '& $link': {
      whiteSpace: "normal",
    },
    // Don't show location dot for level0
    '& $link:after': {
      display: "none",
    },
    ...sectionOffsetStyling,
  },
  level1: {
    paddingLeft: 0,
    ...sectionOffsetStyling,
  },
  level2: {
    fontSize:"1.1rem",
    paddingLeft: isFriendlyUI ? 16 : 12,
    ...sectionOffsetStyling,
  },
  level3: {
    fontSize:"1.1rem",
    color: theme.palette.text.dim700,
    paddingLeft: isFriendlyUI ? 32 : 24,
    ...sectionOffsetStyling,
  },
  level4: {
    fontSize:"1.1rem",
    color: theme.palette.text.dim700,
    paddingLeft: isFriendlyUI ? 48 : 36,
    ...sectionOffsetStyling,
  },
  titleContainer: {
    height: '100%',
    maxHeight: 200,
    display: 'flex',
    flexDirection: 'column-reverse',
    transition: 'opacity 0.4s ease-in-out, height 0.4s ease-in-out, max-height 0.4s ease-in-out, margin-top 0.4s ease-in-out',
  }
}));
export type TableOfContentsRowStyles = typeof styles;

const TableOfContentsRowInner = ({
  indentLevel=0, highlighted=false, href, onClick, children, title, divider, answer, dense, scale, fullHeight, commentToC
}: {
  indentLevel?: number,
  highlighted?: boolean,
  href: string,
  onClick?: (ev: any) => void,
  children?: React.ReactNode,
  title?: boolean,
  divider?: boolean,
  answer?: boolean,
  dense?: boolean,
  /** Used to dynamically set `flex` ratios for the full-height ToC */
  scale?: number,
  fullHeight?: boolean,
  commentToC?: boolean
}) => {
  const classes = useStyles(styles);
  const fullHeightTitle = !!(title && fullHeight);

  const scaleStyling = scale !== undefined ? { flex: scale } : undefined;

  if (divider) {
    return <Components.TableOfContentsDivider scaleStyling={scaleStyling} />
  }
  
  const levelToClassName = (level: number) => {
    switch(level) {
      case 0: return classes.level0;
      case 1: return classes.level1;
      case 2: return classes.level2;
      case 3: return classes.level3;
      default: return classes.level4;
    }
  }

  return <div
    className={classNames(
      classes.root,
      levelToClassName(indentLevel),
      { [classes.titleContainer]: fullHeightTitle },
      { [classes.highlighted]: highlighted },
    )}
    style={scaleStyling}
  >
    <a href={href} onClick={onClick} className={classNames(classes.link, {
      [classes.title]: title,
      [classes.highlightDot]: !answer,
      [classes.dense]: dense
    })}>
      {children}
    </a>
  </div>
}

export const TableOfContentsRow = registerComponent("TableOfContentsRow", TableOfContentsRowInner);

declare global {
  interface ComponentTypes {
    TableOfContentsRow: typeof TableOfContentsRow
  }
}
