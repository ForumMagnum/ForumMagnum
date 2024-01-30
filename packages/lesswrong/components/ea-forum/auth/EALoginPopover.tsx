import React, { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { useAuth0Client } from "../../hooks/useAuth0Client";
import { Link } from "../../../lib/reactRouterWrapper";
import { lightbulbIcon } from "../../icons/lightbulbIcon";
import { FacebookIcon } from "../../icons/FacebookIcon";
import Popover from "@material-ui/core/Popover";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    background: theme.palette.panelBackground.modalBackground,
    borderRadius: theme.borderRadius.default,
    padding: 32,
    width: 386,
    maxWidth: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "24px",
    textAlign: "center",
  },
  modal: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  backdrop: {
    background: theme.palette.background.loginBackdrop,
    backdropFilter: "blur(4px)",
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
  input: {
    width: "100%",
    padding: "15px 17px",
    borderRadius: theme.borderRadius.default,
    background: theme.palette.panelBackground.loginInput,
    color: theme.palette.grey[1000],
    "&::placeholder": {
      color: theme.palette.grey[600],
    },
  },
  showPasswordContainer: {
    position: "relative",
  },
  showPasswordButton: {
    position: "absolute",
    right: 16,
    top: 11,
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
    color: theme.palette.grey[600],
  },
  orHr: {
    borderTop: `1px solid ${theme.palette.grey[600]}`,
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
});

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
  const [error, setError] = useState<string | null>(null);

  const onChangeEmail = useCallback((ev: ChangeEvent<HTMLInputElement>) => {
    setEmail(ev.target.value);
  }, []);

  const onChangePassword = useCallback((ev: ChangeEvent<HTMLInputElement>) => {
    setPassword(ev.target.value);
  }, []);

  const toggleShowPassword = useCallback(() => {
    setShowPassword((showPassword) => !showPassword);
  }, []);

  const onSubmit = useCallback(async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    if (!email || !password) {
      return;
    }

    try {
      setLoading(true);
      await (
        isSignup
          ? client.signup(email, password)
          : client.login(email, password)
      );
      window.location.reload();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setError(e.description || e.message || String(e) || "An error occurred");
      setLoading(false);
    }
  }, [client, email, password, isSignup]);

  const onClickGoogle = useCallback(async () => {
    client.socialLogin("google-oauth2");
  }, [client]);

  const onClickFacebook = useCallback(async () => {
    client.socialLogin("facebook");
  }, [client]);

  const onForgotPassword = useCallback(() => {
    // TODO
    // eslint-disable-next-line no-console
    console.log("Forgot password");
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
      setError(null);
    }
  }, [open]);

  const title = isSignup
    ? "Sign up to get more from the EA Forum"
    : "Welcome back";

  const canSubmit = !!email && !!password && !loading;

  const {ForumIcon, EAButton, Loading} = Components;
  return (
    <Popover
      open={open}
      onClose={onClose}
      anchorReference="none"
      ModalClasses={{root: classes.modal}}
      BackdropProps={{className: classes.backdrop}}
    >
      {open &&
        <div className={classes.root}>
          <ForumIcon
            icon="Close"
            onClick={onClose}
            className={classes.close}
          />
          <div className={classes.lightbulb}>{lightbulbIcon}</div>
          <div className={classes.title}>{title}</div>
          <div className={classes.formContainer}>
            <form onSubmit={onSubmit} className={classes.form}>
              <input
                type="text"
                placeholder="Email"
                value={email}
                onChange={onChangeEmail}
                className={classes.input}
                autoFocus
              />
              <div className={classes.showPasswordContainer}>
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
              {!isSignup &&
                <div className={classes.forgotPassword}>
                  <a onClick={onForgotPassword}>Forgot password?</a>
                </div>
              }
              {error &&
                <div className={classes.error}>
                  {error}
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
        </div>
      }
    </Popover>
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
