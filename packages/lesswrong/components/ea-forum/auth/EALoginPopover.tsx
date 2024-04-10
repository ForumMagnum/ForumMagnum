import React, { ChangeEvent, FC, FormEvent, useCallback, useEffect, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { useAuth0Client } from "../../hooks/useAuth0Client";
import { Link } from "../../../lib/reactRouterWrapper";
import { lightbulbIcon } from "../../icons/lightbulbIcon";
import { FacebookIcon } from "../../icons/FacebookIcon";
import classNames from "classnames";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { useRefetchCurrentUser } from "../../common/withUser";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    width: 386,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "24px",
    textAlign: "center",
  },
  close: {
    color: theme.palette.grey[600],
    cursor: "pointer",
    position: "absolute",
    top: 16,
    right: 16,
    width: 20,
    height: 20,
  },
  lightbulb: {
    color: theme.palette.primary.dark,
    width: 52,
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
  },
  formContainer: {
    width: "100%",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    width: "100%",
    marginBottom: 12,
  },
  inputContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    width: "100%",
    borderRadius: theme.borderRadius.default,
    background: theme.palette.panelBackground.loginInput,
    padding: "0px 17px",
  },
  input: {
    flexGrow: 1,
    padding: "15px 0px",
    color: theme.palette.grey[1000],
    background: "transparent",
    fontSize: 14,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontWeight: 500,
    "&::placeholder": {
      color: theme.palette.grey[600],
    },
  },
  inputBottomMargin: {
    marginBottom: 10,
  },
  showPasswordButton: {
    width: 16,
    cursor: "pointer",
    color: theme.palette.grey[600],
  },
  forgotPassword: {
    color: theme.palette.primary.main,
    fontSize: 14,
    fontWeight: 600,
    marginTop: 4,
    marginBottom: 8,
  },
  message: {
    marginBottom: 4,
    fontSize: 14,
    fontWeight: 500,
  },
  error: {
    color: theme.palette.text.error2,
    marginBottom: 4,
    fontSize: 14,
    fontWeight: 500,
  },
  button: {
    width: "100%",
    height: 50,
    padding: "15px 17px",
    fontWeight: 600,
    "& .Loading-spinner": {
      height: "100%",
      display: "flex",
      alignItems: "center",
    },
  },
  orContainer: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    width: "100%",
    margin: "24px 0",
    fontWeight: 500,
    color: theme.palette.grey[600],
  },
  orHr: {
    borderTop: `1px solid ${theme.palette.border.eaButtonGreyOutline}`,
    flexGrow: 1,
  },
  socialContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    width: "100%",
    marginBottom: 24,
  },
  socialButton: {
    "& svg, & img": {
      width: 20,
      height: 20,
      marginRight: 16,
    },
    "& .MuiButton-label": {
      justifyContent: "flex-start",
    },
  },
  switchPrompt: {
    fontSize: 14,
  },
  switchPromptButton: {
    color: theme.palette.primary.main,
    fontWeight: 700,
    userSelect: "none",
  },
  finePrint: {
    color: theme.palette.grey[600],
    marginTop: 16,
    fontSize: 13,
    fontWeight: 500,
    lineHeight: "140%",
    "& a": {
      textDecoration: "underline",
      "&:hover": {
        textDecoration: "none",
        opacity: 1,
      },
    },
  },
  passwordPolicy: {
    textAlign: "left",
  },
});

type Tree = {
  root: string;
  content: Tree[];
}

const treeify = (data: string): Tree[] => {
  const result: Tree[] = [];
  const levels = [result];
  for (let line of data.split("\n")) {
    let level = line.search(/\S/);
    const trimmed = line.trim();
    const root = trimmed.match(/(\*\s*)?(.*)/)?.[2] ?? trimmed;
    if (root) {
      const content: Tree[] = [];
      levels[level].push({root, content});
      levels[++level] = content;
    }
  }
  return result;
}

const TreeDisplay: FC<{ tree: Tree[] }> = ({ tree }) => {
  return (
    <ul>
      {tree.map(({root, content}) => (
        <>
          <li>{root}</li>
          <TreeDisplay tree={content} />
        </>
      ))}
    </ul>
  );
}

const PasswordPolicy: FC<{
  policy?: string,
  classes: ClassesType<typeof styles>,
}> = ({ policy, classes }) => {
  if (!policy) {
    return null;
  }

  return (
    <div className={classes.passwordPolicy}>
      <TreeDisplay tree={treeify(policy)} />
    </div>
  );
}

const links = {
  googleLogo: "/googleLogo.png",
  eaOrg: "https://effectivealtruism.org",
  terms: "/termsOfUse",
  privacy: "https://ev.org/ops/about/privacy-policy",
} as const;

export const EALoginPopover = ({open, setAction, isSignup, classes}: {
  open: boolean,
  setAction: (action: "login" | "signup" | null) => void,
  isSignup: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const client = useAuth0Client();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [policy, setPolicy] = useState<string | null>(null);
  const refetchCurrentUser = useRefetchCurrentUser();

  const onChangeEmail = useCallback((ev: ChangeEvent<HTMLInputElement>) => {
    setEmail(ev.target.value);
  }, []);

  const onChangePassword = useCallback((ev: ChangeEvent<HTMLInputElement>) => {
    setPassword(ev.target.value);
  }, []);

  const toggleShowPassword = useCallback(() => {
    setShowPassword((showPassword) => !showPassword);
  }, []);

  const onSendPasswordReset = useCallback(async () => {
    setError(null);
    setPolicy(null);
    setMessage(null);
    try {
      setLoading(true);
      await client.resetPassword(email);
      setMessage("Password reset email sent");
    } catch(e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setError(e.description || e.message || String(e) || "An error occurred");
    }
    setLoading(false);
  }, [client, email]);

  const onSubmit = useCallback(async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    if (isResettingPassword) {
      return onSendPasswordReset();
    }

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    setMessage(null);
    setError(null);
    setPolicy(null);

    try {
      setLoading(true);
      await (
        isSignup
          ? client.signup(email, password)
          : client.login(email, password)
      );
      await refetchCurrentUser();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setError(e.description || e.message || String(e) || "An error occurred");
      setPolicy(e.policy ?? null);
    } finally {
      setLoading(false);
    }
  }, [
    client, email, password, isSignup, isResettingPassword,
    onSendPasswordReset, refetchCurrentUser,
  ]);

  const onClickGoogle = useCallback(async () => {
    setMessage(null);
    setError(null);
    setPolicy(null);
    client.socialLogin("google-oauth2");
  }, [client]);

  const onClickFacebook = useCallback(async () => {
    setMessage(null);
    setError(null);
    setPolicy(null);
    client.socialLogin("facebook");
  }, [client]);

  const onForgotPassword = useCallback(() => {
    setIsResettingPassword(true);
  }, []);

  const onLinkToLogin = useCallback(() => {
    setAction("login");
  }, [setAction]);

  const onLinkToSignup = useCallback(() => {
    setAction("signup");
  }, [setAction]);

  const onClose = useCallback(() => {
    setAction(null);
  }, [setAction]);

  useEffect(() => {
    if (!open) {
      setEmail("");
      setPassword("");
      setShowPassword(false);
      setLoading(false);
      setMessage(null);
      setError(null);
      setPolicy(null);
      setIsResettingPassword(false);
    }
  }, [open]);

  const title = isSignup
    ? "Sign up to get more from the EA Forum"
    : "Welcome back";

  const canSubmit = !!email && (!!password || isResettingPassword) && !loading;

  const {BlurredBackgroundModal, ForumIcon, EAButton, Loading} = Components;
  return (
    <BlurredBackgroundModal open={open} onClose={onClose} className={classes.root}>
      <AnalyticsContext pageElementContext="loginPopover">
        <ForumIcon
          icon="Close"
          onClick={onClose}
          className={classes.close}
        />
        <div className={classes.lightbulb}>{lightbulbIcon}</div>
        <div className={classes.title}>{title}</div>
        <div className={classes.formContainer}>
          <form onSubmit={onSubmit} className={classes.form}>
            <div className={classNames(classes.inputContainer, {
              [classes.inputBottomMargin]: isResettingPassword,
            })}>
              <input
                type="text"
                placeholder="Email"
                value={email}
                onChange={onChangeEmail}
                className={classes.input}
                autoFocus
              />
            </div>
            {!isResettingPassword &&
              <div className={classes.inputContainer}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={onChangePassword}
                  className={classes.input}
                />
                <ForumIcon
                  icon={showPassword ? "EyeSlash" : "Eye"}
                  onClick={toggleShowPassword}
                  className={classes.showPasswordButton}
                />
              </div>
            }
            {!isSignup && !isResettingPassword &&
              <div className={classes.forgotPassword}>
                <a onClick={onForgotPassword}>Forgot password?</a>
              </div>
            }
            {message &&
              <div className={classes.message}>
                {message}
              </div>
            }
            {error &&
              <div className={classes.error}>
                {error}
                {policy && <PasswordPolicy policy={policy} classes={classes} />}
              </div>
            }
            <EAButton
              type="submit"
              style="primary"
              disabled={!canSubmit}
              className={classes.button}
            >
              {loading
                ? <Loading />
                : isResettingPassword
                  ? "Request password reset"
                  : isSignup
                    ? "Sign up"
                    : "Login"
              }
            </EAButton>
          </form>
          <div className={classes.orContainer}>
            <span className={classes.orHr} />OR<span className={classes.orHr} />
          </div>
          <div className={classes.socialContainer}>
            <EAButton
              style="grey"
              variant="outlined"
              onClick={onClickGoogle}
              className={classNames(classes.button, classes.socialButton)}
            >
              <img src={links.googleLogo} /> Continue with Google
            </EAButton>
            <EAButton
              style="grey"
              variant="outlined"
              onClick={onClickFacebook}
              className={classNames(classes.button, classes.socialButton)}
            >
              <FacebookIcon /> Continue with Facebook
            </EAButton>
          </div>
          {isSignup
            ? (
              <div className={classes.switchPrompt}>
                Already have an account?{" "}
                <a
                  onClick={onLinkToLogin}
                  className={classes.switchPromptButton}
                >
                  Login
                </a>
              </div>
            )
            : (
              <div className={classes.switchPrompt}>
                Don't have an account?{" "}
                <a
                  onClick={onLinkToSignup}
                  className={classes.switchPromptButton}
                >
                  Sign up
                </a>
              </div>
            )
          }
        </div>
        <div className={classes.finePrint}>
          By creating an{" "}
          <Link to={links.eaOrg} target="_blank" rel="noopener noreferrer">
            EffectiveAltruism.org
          </Link>{" "}
          account, you agree to the{" "}
          <Link to={links.terms} target="_blank" rel="noopener noreferrer">
            Terms of Use
          </Link> and{" "}
          <Link to={links.privacy} target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </Link>.
        </div>
      </AnalyticsContext>
    </BlurredBackgroundModal>
  );
}

const EALoginPopoverComponent = registerComponent(
  "EALoginPopover",
  EALoginPopover,
  {styles},
);

declare global {
  interface ComponentTypes {
    EALoginPopover: typeof EALoginPopoverComponent
  }
}
