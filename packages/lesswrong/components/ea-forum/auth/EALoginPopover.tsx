import React, { ChangeEvent, useCallback, useEffect, useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
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
    display: "block",
    color: theme.palette.primary.main,
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 20,
  },
  button: {
    width: "100%",
    padding: "15px 17px",
    fontWeight: 600,
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
  privacy: "#", // TODO
  forgotPassword: "#", // TODO
  login: "#", // TODO
  signUp: "#", // TODO
} as const;

export const EALoginPopover = ({open, onClose, isSignup, classes}: {
  open: boolean,
  onClose: () => void,
  isSignup: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const onChangeEmail = useCallback((ev: ChangeEvent<HTMLInputElement>) => {
    setEmail(ev.target.value);
  }, []);

  const onChangePassword = useCallback((ev: ChangeEvent<HTMLInputElement>) => {
    setPassword(ev.target.value);
  }, []);

  const toggleShowPassword = useCallback(() => {
    setShowPassword((showPassword) => !showPassword);
  }, []);

  const onSubmit = useCallback(() => {
    // TODO
    // eslint-disable-next-line no-console
    console.log("Submitting", email, password);
  }, [email, password]);

  useEffect(() => {
    if (!open) {
      setEmail("");
      setPassword("");
      setShowPassword(false);
    }
  }, [open]);

  const title = isSignup
    ? "Sign in to get more from the EA Forum"
    : "Welcome back";

  const canSubmit = !!email && !!password;

  const {ForumIcon, EAButton} = Components;
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
          <div className={classes.lightbulb}>{lightbulbIcon}</div>
          <div className={classes.title}>{title}</div>
          <div className={classes.formContainer}>
            <form className={classes.form} onSubmit={onSubmit}>
              <input
                type="text"
                placeholder="Email"
                value={email}
                onChange={onChangeEmail}
                className={classes.input}
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
            </form>
            {!isSignup &&
              <Link
                to={links.forgotPassword}
                className={classes.forgotPassword}
              >
                Forgot password?
              </Link>
            }
            <EAButton
              style="primary"
              onClick={onSubmit}
              disabled={!canSubmit}
              className={classes.button}
            >
              Continue
            </EAButton>
            <div className={classes.orContainer}>
              <span className={classes.orHr} />OR<span className={classes.orHr} />
            </div>
            <div className={classes.socialContainer}>
              <EAButton
                style="grey"
                variant="outlined"
                className={classNames(classes.button, classes.socialButton)}
              >
                <img src={links.googleLogo} /> Continue with Google
              </EAButton>
              <EAButton
                style="grey"
                variant="outlined"
                className={classNames(classes.button, classes.socialButton)}
              >
                <FacebookIcon /> Continue with Facebook
              </EAButton>
            </div>
            {isSignup
              ? (
                <div className={classes.switchPrompt}>
                  Already have an account?{" "}
                  <Link to={links.login} className={classes.switchPromptButton}>
                    Login
                  </Link>
                </div>
              )
              : (
                <div className={classes.switchPrompt}>
                  Don't have an account?{" "}
                  <Link to={links.signUp} className={classes.switchPromptButton}>
                    Sign up
                  </Link>
                </div>
              )
            }
          </div>
          <div className={classes.finePrint}>
            By creating an{" "}
            <Link to={links.eaOrg}>EffectiveAltruism.org</Link>{" "}
            account, you agree to the{" "}
            <Link to={links.terms}>Terms of Use</Link> and{" "}
            <Link to={links.privacy}>Privacy Policy</Link>.
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
