import React, { PureComponent } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { withUpdateCurrentUser, WithUpdateCurrentUserProps } from '../hooks/useUpdateCurrentUser';
import { userEmailAddressIsVerified } from '../../lib/collections/users/helpers';
import withUser from '../common/withUser';
import withErrorBoundary from '../common/withErrorBoundary';
import { Button } from "@/components/mui-replacement";

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.body2,
    marginLeft: theme.spacing.unit
  },
  verifyEmailButton: {
    marginTop: theme.spacing.unit
  }
});

interface ExternalProps {
  resend?: boolean,
}
interface UsersEmailVerificationProps extends ExternalProps, WithUserProps, WithUpdateCurrentUserProps, WithStylesProps {
}
interface UsersEmailVerificationState {
  emailSent: boolean,
}

class UsersEmailVerification extends PureComponent<UsersEmailVerificationProps,UsersEmailVerificationState>
{
  constructor(props: UsersEmailVerificationProps) {
    super(props);
    this.state = {
      emailSent: false,
    };
  }

  sendConfirmationEmail() {
    const { updateCurrentUser, currentUser } = this.props;
    if (!currentUser) return;
    void updateCurrentUser({
      whenConfirmationEmailSent: new Date()
    });
    this.setState({
      emailSent: true
    });
  }

  render() {
    let { resend=false, currentUser, classes } = this.props;
    
    if(userEmailAddressIsVerified(currentUser)) {
      return (
        <div className={classes.root}>
          Your email address is verified.
        </div>
      );
    } else if(this.state.emailSent) {
      return (
        <div className={classes.root}>
          Check your email for a confirmation link.
        </div>
      );
    } else {
      return (
        <div className={classes.root}>
          <div>You need to verify your email address to enable email notifications.</div>
          <Button color="secondary" variant="outlined"
            className={classes.verifyEmailButton}
            onClick={() => this.sendConfirmationEmail()}
          >
            {resend ? "Resend Confirmation Email"
                    : "Send Confirmation Email"}
          </Button>
        </div>
      );
    }
  }
}


const UsersEmailVerificationComponent = registerComponent<ExternalProps>('UsersEmailVerification', UsersEmailVerification, {
  styles,
  hocs: [
    withErrorBoundary,
    withUser,
    withUpdateCurrentUser,
  ]
});

declare global {
  interface ComponentTypes {
    UsersEmailVerification: typeof UsersEmailVerificationComponent
  }
}

export default UsersEmailVerificationComponent;
