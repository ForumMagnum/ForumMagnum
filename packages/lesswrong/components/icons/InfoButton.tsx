import React from 'react';
import classNames from 'classnames';
import ForumIcon from "../common/ForumIcon";
import { defineStyles, useStyles } from '../hooks/useStyles';
import LWTooltip from '../common/LWTooltip';

const styles = defineStyles('InfoButton', (theme: ThemeType) => ({
  iconContainer: {
    cursor: "pointer",
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    padding: 4,
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: theme.palette.grey[200],
    },
  },
  active: {
    backgroundColor: theme.palette.grey[300],
  },
  icon: {
    color: theme.palette.grey[600],
    fontSize: 18,
  },
}));

const InfoButton = ({className, onClick, isActive = false, tooltip}: {
  className?: string,
  onClick?: (e: React.MouseEvent) => void,
  isActive?: boolean,
  tooltip?: string,
}) => {
  const classes = useStyles(styles);
  
  return (
    <LWTooltip title={tooltip} disabled={!tooltip}>
      <div 
        className={classNames(classes.iconContainer, className, { [classes.active]: isActive })} 
        onClick={onClick}
      >
        <ForumIcon icon="QuestionMark" className={classes.icon} />
      </div>
    </LWTooltip>
  );
};

export default InfoButton;
