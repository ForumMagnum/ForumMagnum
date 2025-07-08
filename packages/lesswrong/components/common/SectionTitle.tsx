import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames'
import { isFriendlyUI } from '../../themes/forumTheme';
import { Link } from '../../lib/reactRouterWrapper';
import { slugify } from '@/lib/utils/slugify';
import { Typography } from "./Typography";

export const sectionTitleStyle = isFriendlyUI
  ? (theme: ThemeType) => ({
    margin: 0,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: "14px",
    lineHeight: "21px",
    fontWeight: 700,
    letterSpacing: "0.03em",
    color: theme.palette.grey[600],
    textTransform: "uppercase",
  })
  : (theme: ThemeType) => ({
    margin: 0,
    ...theme.typography.headerStyle,
    fontSize: "2.3rem",
  });

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing.unit*3,
    paddingBottom: 8,
  },
  noTopMargin: {
    marginTop: 0
  },
  noBottomPadding: {
    paddingBottom: 0
  },
  title: sectionTitleStyle(theme),
  largeTitle: isFriendlyUI
    ? {
      margin: 0,
      fontFamily: theme.palette.fonts.sansSerifStack,
      fontSize: 20,
      fontWeight: 700,
      color: theme.palette.grey[1000],
      [theme.breakpoints.down("xs")]: {
        fontSize: 16,
      },
    }
    : sectionTitleStyle(theme),
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
  titleClassName?: string,
  rootClassName?: string,
  title: React.ReactNode,
  large?: boolean,
  noTopMargin?: boolean,
  noBottomPadding?: boolean,
  centered?: boolean,
  anchor?: string,
  href?: string,
}

// This is meant to be used as the primary section title for the central page layout (normally used in conjunction with SingleColumnSection){}
const SectionTitle = ({
  title,
  large,
  noTopMargin,
  noBottomPadding,
  centered,
  anchor,
  href,
  children,
  titleClassName,
  rootClassName,
  classes,
}: SectionTitleProps & {classes: ClassesType<typeof styles>}) => {
  return (
    <div className={classNames(classes.root, rootClassName, {[classes.noTopMargin]: noTopMargin, [classes.noBottomPadding]: noBottomPadding} )}>
      <Typography
        id={getAnchorId(anchor, title)}
        variant='display1'
        className={classNames(
          large ? classes.largeTitle : classes.title,
          titleClassName,
        )}
      >
        {href
          ? <Link to={href}>{title}</Link>
          : title
        }
      </Typography>
      {!centered && <div className={classes.children}>{ children }</div>}
    </div>
  )
}

export default registerComponent('SectionTitle', SectionTitle, {styles, stylePriority: -1});


