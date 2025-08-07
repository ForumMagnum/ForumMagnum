import React from "react";
import { defineStyles, useStyles } from "../hooks/useStyles";
import classNames from "classnames";

const styles = defineStyles("UltraFeedMetaInfoPill", (theme: ThemeType) => ({
  // Base styles that should always apply
  base: {
    alignSelf: 'center',
    height: 22,
    lineHeight: 1.4,
    padding: '2px 6px',
    fontSize: 12,
    fontWeight: 500,
    borderRadius: 4,
    display: 'inline-block',
    marginLeft: 'auto',
    [theme.breakpoints.down('sm')]: {
      lineHeight: 1.2,
    },
  },
  defaultColors: {
    color: theme.palette.grey[600],
    border: `1px solid ${theme.palette.grey[400]}`,
  },
  readItemColors: {
    color: theme.palette.grey[800],
    border: `1px solid ${theme.palette.grey[600]}`,
    [theme.breakpoints.down('sm')]: {
      backgroundColor: theme.palette.grey[300],
      color: theme.palette.grey[800],
    }
  },
  hideOnDesktop: {
    display: 'none',
    [theme.breakpoints.down('sm')]: {
      display: 'inline-block',
    },
  },
}));

type PillType = 'read' | 'quickTake';

const pillLabels: Record<PillType, string> = {
  read: 'Read',
  quickTake: 'Quick Take',
};

const UltraFeedMetaInfoPill = ({
  type,
  readStyles,
  className,
}: {
  type: PillType;
  readStyles?: boolean;
  className?: string;
}) => {
  const classes = useStyles(styles);

  const useReadStyles = readStyles || type === 'read';

  return (
    <span 
      className={classNames(
        classes.base,
        { 
          [classes.defaultColors]: !useReadStyles,
          [classes.readItemColors]: useReadStyles,
        },
        className
      )}
    >
      {pillLabels[type]}
    </span>
  );
};

export default UltraFeedMetaInfoPill;
