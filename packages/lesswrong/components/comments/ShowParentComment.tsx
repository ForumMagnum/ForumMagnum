import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import SubdirectoryArrowLeft from '@/lib/vendor/@material-ui/icons/src/SubdirectoryArrowLeft';
import classNames from 'classnames';
import { legacyBreakpoints } from '../../lib/utils/theme';
import LWTooltip from "../common/LWTooltip";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('ShowParentComment', (theme: ThemeType) => ({
  root: {
    paddingRight: 8,
    paddingTop: 8,
    paddingBottom: 8,
    cursor: "pointer",
    color: theme.palette.icon.slightlyDim2,
  },
  active: {
    color: theme.palette.icon.dim5,
  },
  icon: {
    fontSize: 12,
    transform: "rotate(90deg)"
  },
  parentComment: { // UNUSED
    background: theme.palette.panelBackground.default,
    position: "absolute",
    zIndex: 2,
    maxWidth: 650,
    bottom: "100%",
    left: 0,
    boxShadow: theme.palette.boxShadow.comment,
  },
  usernameSpacing: { // UNUSED
    paddingRight: 1,
    color: theme.palette.icon.dim5,
    [legacyBreakpoints.maxSmall]: {
      padding: "0 10px",
    }
  },
  activeArrow: {
    transform: "rotate(-90deg)"
  }
}))

const ShowParentComment = ({comment, active, onClick}: {
  comment: CommentsList,
  active?: boolean,
  onClick?: any,
}) => {
  const classes = useStyles(styles);

  if (!comment) return null;
  
  return (
    <LWTooltip title={`${active ? "Hide" : "Show"} previous comment`}>
      <span className={classNames(classes.root, {[classes.active]: active})} onClick={onClick}>
        <SubdirectoryArrowLeft className={classNames(classes.icon, {[classes.activeArrow]: active})}/>
      </span>
    </LWTooltip>
  )
};

export default registerComponent('ShowParentComment', ShowParentComment, {styles});



