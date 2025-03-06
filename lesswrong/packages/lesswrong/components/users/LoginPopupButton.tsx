import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { useDialog } from '../common/withDialog';
import LWTooltip from "@/components/common/LWTooltip";

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.body2,
    color: theme.palette.primary.main,
  },
});

const LoginPopupButton = ({classes, children, title, className}: {
  classes: ClassesType<typeof styles>,
  children: React.ReactNode,
  title?: string,
  className?: string
}) => {
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
              componentName: "LoginPopup",
              componentProps: {}
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

const LoginPopupButtonComponent = registerComponent('LoginPopupButton', LoginPopupButton, {styles});

declare global {
  interface ComponentTypes {
    LoginPopupButton: typeof LoginPopupButtonComponent
  }
}

export default LoginPopupButtonComponent;
