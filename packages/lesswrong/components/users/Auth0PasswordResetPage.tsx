import React, { useState } from 'react';
import { useLocation } from '../../lib/routeUtil';
import { useAuth0Client } from '../hooks/useAuth0Client';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { lightbulbIcon } from '../icons/lightbulbIcon';
import EAButton from "../ea-forum/EAButton";
import SingleColumnSection from "../common/SingleColumnSection";

const styles = (theme: ThemeType) => ({
  root: {
    background: theme.palette.background.pageActiveAreaBackground,
    marginTop: 24,
    padding: 24,
    borderRadius: theme.borderRadius.default
  },
  content: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    maxWidth: 386,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    margin: '0 auto',
    padding: theme.spacing.unit * 2,
  },
  header: {
    fontWeight: 500,
    marginLeft: 4
  },
  lightbulb: {
    color: theme.palette.primary.dark,
    width: 52,
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
  },
  subtitle: {
    color: theme.palette.grey[800]
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderRadius: theme.borderRadius.default,
    background: theme.palette.panelBackground.loginInput,
    padding: '0 17px',
  },
  input: {
    flexGrow: 1,
    padding: '15px 0px',
    color: theme.palette.grey[1000],
    background: 'transparent',
    fontSize: 14,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontWeight: 500,
    '&::placeholder': {
      color: theme.palette.grey[600],
    },
  },
  message: {
    fontSize: 14,
    fontWeight: 500,
    color:  theme.palette.grey[1000],
  },
  error: {
    fontSize: 14,
    fontWeight: 500,
    color: theme.palette.text.error2,
  },
  button: {
    width: '100%',
    height: 50,
    padding: '15px 17px',
    fontWeight: 600,
  },
});

const Auth0PasswordResetPage = ({ classes }: { classes: ClassesType<typeof styles> }) => {
  const { query } = useLocation();
  const client = useAuth0Client();

  const [email, setEmail] = useState(query.email ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await client.resetPassword(email);
      setMessage('Password reset email sent');
    } catch (e) {
      setError('Error sending password reset email');
    }
  };

  return (
    <SingleColumnSection className={classes.root}>
      <div className={classes.content}>
        <div className={classes.header}>
          <div className={classes.lightbulb}>{lightbulbIcon}</div>
          <h1 className={classes.title}>Set password</h1>
          <p className={classes.subtitle}>Submit the form below to receive a password reset email.</p>
        </div>
        <form onSubmit={handleSubmit} className={classes.form}>
          <div className={classes.inputContainer}>
            <input
              type="email"
              className={classes.input}
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {message && <div className={classes.message}>{message}</div>}
          {error && <div className={classes.error}>{error}</div>}
          <EAButton type="submit" style="primary" className={classes.button}>
            Submit
          </EAButton>
        </form>
      </div>
    </SingleColumnSection>
  );
};

export default registerComponent('Auth0PasswordResetPage', Auth0PasswordResetPage, { styles });


