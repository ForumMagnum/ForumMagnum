import React, { FormEvent, useCallback, useEffect, useState } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useUpdateCurrentUser } from "../hooks/useUpdateCurrentUser";
import { useCurrentUser } from "../common/withUser";
import { useMessages } from "../common/withMessages";
import { useLocation, useNavigate } from "@/lib/routeUtil";
import { Link } from "@/lib/reactRouterWrapper";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import qs from "qs";
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
    display: "flex",
    gap: "12px",
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 24,
    fontWeight: 600,
    marginTop: 24,
    marginBottom: 32,
    "& svg": {
      transform: "translateY(2px)",
    },
  },
  info: {
    color: theme.palette.grey[600],
    "--icon-size": "20px",
  },
  form: {
    display: "flex",
    gap: "8px",
    marginBottom: 32,
  },
  button: {
    minWidth: "min-content",
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

const caseInsensitveIncludes = (haystack: string[], needle: string) => {
  const lowerHaystack = haystack.map((item) => item.toLowerCase());
  const lowerNeedle = needle.toLowerCase();
  return lowerHaystack.indexOf(lowerNeedle) >= 0;
}

const KeywordsPage = ({classes}: {classes: ClassesType<typeof styles>}) => {
  const updateCurrentUser = useUpdateCurrentUser();
  const currentUser = useCurrentUser();
  const {flash} = useMessages();
  const keywordAlerts = currentUser?.keywordAlerts;
  const [keyword, setKeyword] = useState("");
  const [updating, setUpdating] = useState(false);

  const saveKeyword = useCallback(async (value: string) => {
    const normalized = value.trim().replace(/\s+/g, " ");
    if (
      normalized &&
      keywordAlerts &&
      !caseInsensitveIncludes(keywordAlerts, normalized)
    ) {
      setUpdating(true);
      await updateCurrentUser({
        keywordAlerts: uniq([normalized, ...keywordAlerts]),
      });
      setUpdating(false);
      flash(`Keyword alert added "${normalized}"`)
    }
  }, [flash, keywordAlerts, updateCurrentUser]);

  const onSubmitKeyword = useCallback(async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    await saveKeyword(keyword);
    setKeyword("");
  }, [keyword, saveKeyword]);

  const onRemove = useCallback(async (keyword: string) => {
    if (keywordAlerts) {
      setUpdating(true);
      await updateCurrentUser({
        keywordAlerts: uniq(keywordAlerts.filter((kw) => kw !== keyword)),
      });
      setUpdating(false);
      flash(`Keyword alert removed "${keyword}"`)
    }
  }, [flash, updateCurrentUser, keywordAlerts]);

  // Automatically add a keyword from the ?add= query param (used on search page)
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    const {add: keywordToAdd, ...restOfQuery} = location.query;
    if (keywordToAdd) {
      void saveKeyword(keywordToAdd);
      navigate(
        {...location, search: qs.stringify(restOfQuery)},
        {replace: true},
      );
    }
  }, [navigate, location, saveKeyword]);

  if (!currentUser) {
    return (
      <ErrorAccessDenied />
    );
  }

  return (
    <AnalyticsContext pageContext="keywordsPage">
      <SingleColumnSection className={classNames(updating && classes.updating)}>
        <HeadTags />
        <div className={classes.title}>
          Keyword alerts
          <LWTooltip
            title="Get notified about new posts that contains a keyword"
            className={classes.info}
          >
            <ForumIcon icon="InfoCircle" />
          </LWTooltip>
        </div>
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
