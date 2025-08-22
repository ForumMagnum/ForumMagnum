import React, { CSSProperties, useRef, useState } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { useTracking } from '../../../lib/analyticsEvents';
import type { Placement as PopperPlacementType } from "popper.js";
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import PopperCard from "../../common/PopperCard";
import UserActions from "./UserActions";
import LWClickAwayListener from "../../common/LWClickAwayListener";

const styles = defineStyles("UserActionsButton", (theme: ThemeType) => ({
  root: {
    cursor: "pointer",
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    padding: '0 8px',
    borderRadius: 4,
    backgroundColor: theme.palette.grey[200],
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: 18,
    fontWeight: 300,
    color: theme.palette.grey[500],
    fontFamily: theme.palette.fonts.sansSerifStack,
    '&:hover': {
      backgroundColor: theme.palette.grey[300],
      color: theme.palette.grey[900],
    },
  },
  popper: {
    position: "relative",
    zIndex: theme.zIndexes.postItemMenu
  },
}));

interface UserActionsComponentProps {
  user: UsersMinimumInfo;
  closeMenu: () => void;
  from?: string;
}

const UserActionsButton = ({
  user, 
  placement = 'bottom-start',
  popperGap, 
  flip = true,
  className,
  from = "userActions",
  ActionsComponent,
}: {
  user: UsersMinimumInfo,
  placement?: PopperPlacementType,
  popperGap?: number,
  flip?: boolean,
  className?: string,
  from?: string,
  ActionsComponent?: React.ComponentType<UserActionsComponentProps>,
}) => {
  const classes = useStyles(styles);
  const anchorEl = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const {captureEvent} = useTracking();

  let gapStyle: CSSProperties | undefined;
  if (popperGap) {
    switch (placement) {
      case 'right-start':
        gapStyle = {marginLeft: popperGap};
        break;
      case 'left-start':
        gapStyle = {marginRight: popperGap};
        break;
      case 'bottom-start':
        gapStyle = {marginTop: popperGap};
        break;
      default:
        break;
    }
  }

  const handleSetOpen = (open: boolean) => {
    captureEvent("tripleDotClick", {open, itemType: "user", userId: user._id});
    setIsOpen(open);
  };

  const MenuComponent = ActionsComponent ?? UserActions;
  
  return (
    <div className={classNames(classes.root, className)}>
      <div ref={anchorEl}>
        <div className={classes.button} onClick={() => handleSetOpen(!isOpen)}>
          •••
        </div>
      </div>
      <PopperCard
        open={isOpen}
        anchorEl={anchorEl.current}
        placement={placement}
        allowOverflow
        flip={flip}
        style={gapStyle}
        className={classes.popper}
      >
        <LWClickAwayListener onClickAway={() => handleSetOpen(false)}>
          <MenuComponent 
            user={user} 
            closeMenu={() => handleSetOpen(false)} 
            from={from}
          />
        </LWClickAwayListener>
      </PopperCard>
    </div>
  );
};

export default registerComponent('UserActionsButton', UserActionsButton);

