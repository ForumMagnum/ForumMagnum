import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import LWDialog from "../common/LWDialog";
import LoginForm from "./LoginForm";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('LoginPopup', (theme: ThemeType) => ({
  dialog: {
    zIndex: theme.zIndexes.loginDialog
  },
  paper: {
    // Remove left/right margins so that the login form fits on small phone
    // screens. (It's fixed-width horizontally centered anyways so this is
    // fine.)
    marginLeft: 0,
    marginRight: 0,
  },
}));

// Makes its child a link (wrapping it in an <a> tag) which opens a login
// dialog.
const LoginPopup = ({onClose}: {
  onClose?: () => void,
}) => {
  const classes = useStyles(styles);

  return (
    <LWDialog
      open={true}
      onClose={onClose}
      className={classes.dialog}
      paperClassName={classes.paper}
    >
      <LoginForm />
    </LWDialog>
  );
}

export default registerComponent('LoginPopup', LoginPopup, {styles});


