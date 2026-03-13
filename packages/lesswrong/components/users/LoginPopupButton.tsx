import React from 'react';
import { useCurrentUser } from '../common/withUser';
import { useDialog } from '../common/withDialog';
import LoginPopup from "./LoginPopup";
import LWTooltip from "../common/LWTooltip";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('LoginPopupButton', (theme: ThemeType) => ({
  root: {
    ...theme.typography.body2,
    color: theme.palette.primary.main,
  },
}));

const LoginPopupButton = ({children, title, className}: {
  children: React.ReactNode,
  title?: string,
  className?: string
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  // This component is intended only for buttons whose sole purpose is logging a user in 
  // (not wrapped around other buttons with other functionality. For that, just add
  // openDialog + "LoginPopup" to their functionality
  const { openDialog } = useDialog();
  if (currentUser) return null

  return (
    <LWTooltip title={title}>
      <a className={className ? className : classes.root} onClick={(ev) => {
          if (!currentUser) {
            openDialog({
              name: "LoginPopup",
              contents: ({onClose}) => <LoginPopup onClose={onClose}/>
            });
            ev.preventDefault();
          }
        }}
      >
        { children }
      </a>
    </LWTooltip>
  )
}

export default LoginPopupButton;


