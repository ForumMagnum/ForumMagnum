import React, { useCallback, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useCurrentUser } from "../common/withUser";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    width: 760,
    maxWidth: "100%",
    margin: "0 auto",
  },
  title: {
    fontSize: 28,
    fontWeight: 600,
    margin: "40px 0",
  },
  tabs: {
    "& .MuiTabs-flexContainer": {
      gap: "32px",
    },
    "& .MuiTab-root": {
      minWidth: 100,
      [theme.breakpoints.down("xs")]: {
        minWidth: 50,
      },
    },
    "& .MuiTab-labelContainer": {
      fontSize: 14,
      fontWeight: 700,
      letterSpacing: "0.28px",
      textTransform: "uppercase",
    },
  },
});

const tabs = [
  {
    name: "all",
  },
  {
    name: "karma",
  },
  {
    name: "comments",
  },
  {
    name: "reactions",
  },
  {
    name: "new posts",
  },
] as const;

type TabType = typeof tabs[number]["name"];

export const NotificationsPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const [tab, setTab] = useState<TabType>(tabs[0].name);

  const onChangeTab = useCallback((_: React.ChangeEvent, value: TabType) => {
    setTab(value);
  }, []);

  const currentUser = useCurrentUser();
  if (!currentUser) {
    const {WrappedLoginForm} = Components;
    return (
      <WrappedLoginForm />
    );
  }

  return (
    <div className={classes.root}>
      <div className={classes.title}>Notifications</div>
      <Tabs
        value={tab}
        onChange={onChangeTab}
        className={classes.tabs}
        textColor="primary"
        aria-label="select notification type"
        scrollable
        scrollButtons="off"
      >
        {tabs.map(({name}) => (
          <Tab label={name} value={name} key={name} />
        ))}
      </Tabs>
    </div>
  );
}

const NotificationsPageComponent = registerComponent(
  "NotificationsPage",
  NotificationsPage,
  {styles},
);

declare global {
  interface ComponentTypes {
    NotificationsPage: typeof NotificationsPageComponent
  }
}
