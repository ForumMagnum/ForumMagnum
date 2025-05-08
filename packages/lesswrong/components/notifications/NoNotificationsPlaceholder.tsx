import React, { useCallback, useState } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useCurrentUser } from "../common/withUser";
import { getUserEmail } from "@/lib/collections/users/helpers";
import { useUpdateCurrentUser } from "../hooks/useUpdateCurrentUser";
import { ForumIcon } from "../common/ForumIcon";
import { EAOnboardingInput } from "../ea-forum/onboarding/EAOnboardingInput";
import { EAButton } from "../ea-forum/EAButton";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "32px",
    padding: "60px 24px",
    color: theme.palette.grey[600],
    lineHeight: "140%",
    textAlign: "center",
  },
  icon: {
    width: 60,
    height: 60,
  },
  title: {
    color: theme.palette.grey[1000],
    fontSize: 18,
    fontWeight: 600,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 500,
    lineHeight: "21px",
  },
  emailContainer: {
    marginBottom: -30,
    width: "100%",
    display: "flex",
    gap: "8px",
  },
  input: {
    height: 44,
  },
  button: {
    width: 44,
    height: 44,
    whiteSpace: "nowrap",
  },
});

const SubscribedPlaceholder = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <div className={classes.root}>
      <ForumIcon icon="BellBorder" className={classes.icon} />
      <div className={classes.title}>
        No notifications yet
      </div>
      <div className={classes.subtitle}>
        Subscribe to posts, authors or comments to get notified about new activity
      </div>
    </div>
  );
}

const NotSubscribedPlaceholder = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const currentUserEmail = getUserEmail(currentUser);
  const [email, setEmail] = useState(currentUserEmail ?? "");
  const [canEditEmail] = useState(!currentUserEmail?.length);

  const onSubmit = useCallback(() => {
    void updateCurrentUser({
      email: canEditEmail ? email : undefined,
      subscribedToDigest: true,
    });
  }, [updateCurrentUser, email, canEditEmail]);

  if (!currentUser) {
    return null;
  }
  return (
    <div className={classes.root}>
      <ForumIcon icon="EAEnvelope" className={classes.icon} />
      <div className={classes.title}>
        Subscribe to email digest
      </div>
      <div className={classes.subtitle}>
        The EA Forum Digest is a curated reading list of Forum posts,{" "}
        sent every Wednesday
      </div>
      <div className={classes.emailContainer}>
        <EAOnboardingInput
          value={email}
          setValue={setEmail}
          disabled={!canEditEmail}
          placeholder="Email"
          className={classes.input}
        />
        <EAButton
          style="primary"
          onClick={onSubmit}
          disabled={email.length < 1}
          className={classes.button}
        >
          -&gt;
        </EAButton>
      </div>
    </div>
  );
}

const NoNotificationsPlaceholderInner = ({subscribedToDigest, classes}: {
  subscribedToDigest: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    subscribedToDigest
      ? <SubscribedPlaceholder classes={classes} />
      : <NotSubscribedPlaceholder classes={classes} />
    );
}

export const NoNotificationsPlaceholder = registerComponent(
  "NoNotificationsPlaceholder",
  NoNotificationsPlaceholderInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    NoNotificationsPlaceholder: typeof NoNotificationsPlaceholder
  }
}
