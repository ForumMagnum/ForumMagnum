import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { getSiteUrl } from "@/lib/vulcan-lib/utils";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 15,
    lineHeight: "22px",
    textWrap: "pretty"
  },
  link: {
    color: theme.palette.primary.main,
  },
  hr: {
    marginTop: 30,
  }
});

const EmailFacebookMigration = ({
  email,
  user,
  hasGoogleLogin,
  hasEmailLogin,
  classes,
}: {
  email: string;
  user: Pick<DbUser, "displayName">;
  hasGoogleLogin: boolean;
  hasEmailLogin: boolean;
  classes: ClassesType<typeof styles>;
}) => {
  const isPlural = hasGoogleLogin && hasEmailLogin;

  const loginMethod = hasGoogleLogin ? "Google" : "email/password";
  const article = loginMethod === "email/password" ? "an" : "a";

  const existingLoginMethodsText = `Your account already has${isPlural ? " " : ` ${article} `}${hasGoogleLogin ? "Google" : ""}${
    hasGoogleLogin && hasEmailLogin ? " and " : ""
  }${hasEmailLogin ? "email/password" : ""} login${
    hasGoogleLogin && hasEmailLogin ? " methods" : ""
  } associated with it. If you can keep using ${isPlural ? "these" : "this"}, you don't need to do anything.`;

  const resetLink = `${getSiteUrl()}setPassword?email=${encodeURIComponent(email)}`;

  const keepExistingSolution = (hasGoogleLogin || hasEmailLogin);
  const googleSolution = hasGoogleLogin && !hasEmailLogin;
  const emailSolution = hasEmailLogin;
  const noAlternativeSolution = !hasGoogleLogin && !hasEmailLogin;

  const multipleSolutions = [keepExistingSolution, googleSolution, emailSolution, noAlternativeSolution].filter(Boolean).length > 1;

  return (
    <div className={classes.root}>
      <p>Hi {user.displayName},</p>

      <p>
        I hope you&apos;re doing well. We are planning to disable Facebook login on the EA Forum* on <b>April 2nd 2025</b>, and I
        am reaching out to request that you switch to using{hasGoogleLogin ? " another login method" : " email/password login"}.
      </p>

      {/* If the user already has some other login method(s) besides Facebook */}
      {keepExistingSolution && <p>{existingLoginMethodsText}</p>}

      {/* If Google but no email/password */}
      {googleSolution && (
        <p>
          If you would like to additionally set up email/password login, you can follow the link below to receive a
          password reset email. You will then be able to log in using this email and the new password you set:
        </p>
      )}

      {/* If the user already has email/password */}
      {emailSolution && (
        <p>
          If you would like to use email/password login but have forgotten your password, you can click the link below
          to receive a password reset email:
        </p>
      )}

      {/* If the user has only Facebook (no Google or email/password) */}
      {noAlternativeSolution && (
        <p>
          Please follow the link below to set up an email/password login. You
          will then be able to log in using this email and the new password you set:
        </p>
      )}

      <p>
        <a href={resetLink}>{resetLink}</a>
      </p>

      <p>
        If {multipleSolutions ? "none of these solutions" : "this solution doesn't"} work for you, please contact us at{" "}
        <a href="mailto:forum@centreforeffectivealtruism.org" className={classes.link}>
          forum@centreforeffectivealtruism.org
        </a>{" "}
        and we will do our best to help.
      </p>

      <p>
        Best,
        <br />
        Will Howard (for the EA Forum team)
      </p>

      <p>
        <i>*This is to simplify our infrastructure, as relatively few people use Facebook login.</i>
      </p>

      <hr className={classes.hr} />
    </div>
  );
};

const EmailFacebookMigrationComponent = registerComponent(
  "EmailFacebookMigration",
  EmailFacebookMigration,
  { styles }
);

declare global {
  interface ComponentTypes {
    EmailFacebookMigration: typeof EmailFacebookMigrationComponent;
  }
}

export default EmailFacebookMigrationComponent;
