import React, { FormEvent, useCallback, useState } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useUpdateCurrentUser } from "../hooks/useUpdateCurrentUser";
import { useCurrentUser } from "../common/withUser";
import { Link } from "@/lib/reactRouterWrapper";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import uniq from "lodash/uniq";
import classNames from "classnames";
import SingleColumnSection from "../common/SingleColumnSection";
import ErrorAccessDenied from "../common/ErrorAccessDenied";
import HeadTags from "../common/HeadTags";
import SectionTitle from "../common/SectionTitle";
import EAOnboardingInput from "../ea-forum/onboarding/EAOnboardingInput";
import EAButton from "../ea-forum/EAButton";
import ForumIcon from "../common/ForumIcon";
import LWTooltip from "../common/LWTooltip";
import Loading from "../vulcan-core/Loading";

const styles = (theme: ThemeType) => ({
  updating: {
    opacity: 0.8,
    pointerEvents: "none",
  },
  title: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 24,
    fontWeight: 600,
    marginTop: 24,
    marginBottom: 32,
  },
  form: {
    display: "flex",
    gap: "8px",
    marginBottom: 32,
  },
  button: {
    whiteSpace: "nowrap",
  },
  noAlerts: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    color: theme.palette.grey[600],
  },
  savedKeyword: {
    display: "flex",
    gap: "16px",
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 16,
    marginBottom: 8,
    "&:hover $removeButton": {
      display: "block",
    },
  },
  link: {
    color: theme.palette.primary.dark,
  },
  removeButton: {
    cursor: "pointer",
    display: "none",
    fontSize: 18,
    marginTop: 1,
    "&:hover": {
      color: theme.palette.error.dark,
    },
  },
});

const KeywordsPage = ({classes}: {classes: ClassesType<typeof styles>}) => {
  const updateCurrentUser = useUpdateCurrentUser();
  const currentUser = useCurrentUser();
  const keywordAlerts = currentUser?.keywordAlerts;
  const [keyword, setKeyword] = useState("");
  const [updating, setUpdating] = useState(false);

  const onSubmitKeyword = useCallback(async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const normalized = keyword.trim().replace(/\s+/g, " ");
    if (normalized && keywordAlerts && keywordAlerts.indexOf(normalized) < 0) {
      setUpdating(true);
      await updateCurrentUser({
        keywordAlerts: uniq([...keywordAlerts, normalized]).sort(),
      });
      setUpdating(false);
    }
    setKeyword("");
  }, [keyword, keywordAlerts, updateCurrentUser]);

  const onRemove = useCallback(async (keyword: string) => {
    if (keywordAlerts) {
      setUpdating(true);
      await updateCurrentUser({
        keywordAlerts: uniq(keywordAlerts.filter((kw) => kw !== keyword)).sort(),
      });
      setUpdating(false);
    }
  }, [updateCurrentUser, keywordAlerts]);

  if (!currentUser) {
    return (
      <ErrorAccessDenied />
    );
  }

  return (
    <AnalyticsContext pageContext="keywordsPage">
      <SingleColumnSection className={classNames(updating && classes.updating)}>
        <HeadTags />
        <div className={classes.title}>Keyword alerts</div>
        <SectionTitle title="Add alert" />
        <form onSubmit={onSubmitKeyword} className={classes.form}>
          <EAOnboardingInput
            value={keyword}
            setValue={setKeyword}
            placeholder="Type a keyword..."
          />
          <EAButton
            style="primary"
            type="submit"
            eventProps={{keyword}}
            className={classes.button}
          >
            Add alert
          </EAButton>
        </form>
        <SectionTitle title="Your alerts" />
        {keywordAlerts?.length === 0 &&
          <div className={classes.noAlerts}>No saved keyword alerts</div>
        }
        {keywordAlerts?.map((alert) => (
          <div key={alert} className={classes.savedKeyword}>
            <Link
              to={`/keywords/${encodeURIComponent(alert)}`}
              className={classes.link}
            >
              {alert}
            </Link>
            <LWTooltip title="Remove" placement="top">
              <ForumIcon
                icon="Close"
                onClick={onRemove.bind(null, alert)}
                className={classes.removeButton}
              />
            </LWTooltip>
          </div>
        ))}
        {updating && <Loading />}
      </SingleColumnSection>
    </AnalyticsContext>
  );
}

export default registerComponent("KeywordsPage", KeywordsPage, {styles});
