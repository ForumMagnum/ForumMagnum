import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import classNames from 'classnames';
import { commentBodyStyles } from '../../themes/stylePiping';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: 'flex',
    justifyContent: 'space-between',
    columnGap: 8,
    fontFamily: theme.typography.commentStyle.fontFamily,
    fontSize: 14,
    lineHeight: '18px',
    fontWeight: '500',
    padding: 12,
    borderRadius: 4,
    marginBottom: 8,
    ...commentBodyStyles(theme)
  },
  icon: {
    transform: "translateY(1px)",
    fontSize: 16,
  },
  message: {
    flexGrow: 1
  },
  warning: {
    backgroundColor: theme.palette.background.warningTranslucent,
    color: theme.palette.text.warning,
  },
  neutral: {
    color: theme.palette.grey[900],
    backgroundColor: theme.palette.grey[100],
    "& a": {
      textDecoration: "underline",
      '&:hover': {
        color: theme.palette.primary.dark,
        opacity: 1
      }
    }
  }
});

const WarningBanner = ({message, classes, color="warning", showIcon=true}: {
  message: string,
  classes: ClassesType,
  color?: "neutral"|"warning",
  showIcon?: boolean
}) => {
  const { ContentItemBody, ForumIcon, ContentStyles } = Components
  return <div className={classNames(classes.root, {
    [classes.neutral]: color === "neutral",
    [classes.warning]: color === "warning",
  })}>
    {showIcon && <ForumIcon icon="Warning" className={classes.icon} />}
    <ContentItemBody className={classes.message} dangerouslySetInnerHTML={{__html: message }}/>
  </div>
}

const WarningBannerComponent = registerComponent('WarningBanner', WarningBanner, {styles});

declare global {
  interface ComponentTypes {
    WarningBanner: typeof WarningBannerComponent
  }
}
