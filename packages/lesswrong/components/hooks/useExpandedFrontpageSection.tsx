import { useState, useCallback, useEffect } from "react";
import { useCurrentUser } from "../common/withUser";
import { useTracking } from "../../lib/analyticsEvents";
import { useCookiesWithConsent } from "./useCookiesWithConsent";
import { useMutation, gql } from "@apollo/client";
import moment from "moment";

export type ExpandedFrontpageSections = NonNullable<DbUser["expandedFrontpageSections"]>;
export type ExpandedFrontpageSection = keyof ExpandedFrontpageSections;
export type DefaultExpandedType =
  "all" |
  "none" |
  "loggedIn" |
  "loggedOut" |
  ((currentUser: UsersCurrent | null) => boolean);

export type UseExpandedFrontpageSectionProps = {
  section: ExpandedFrontpageSection,
  defaultExpanded: DefaultExpandedType,
  onExpandEvent?: string,
  onCollapseEvent?: string,
  cookieName: string,
  forceSetCookieIfUndefined?: boolean,
}

const isDefaultExpanded = (
  currentUser: UsersCurrent | null,
  defaultExpanded: DefaultExpandedType,
): boolean => {
  if (typeof defaultExpanded === "function") {
    return defaultExpanded(currentUser);
  }
  switch (defaultExpanded) {
  case "none":
      return false;
  case "all":
      return true;
  case "loggedIn":
      return !!currentUser;
  case "loggedOut":
      return !currentUser;
  }
}

const isInitialExpanded = (
  section: ExpandedFrontpageSection,
  defaultExpanded: DefaultExpandedType,
  currentUser: UsersCurrent | null,
  cookies: Record<string, string>,
  cookieName: string,
): boolean => {
  if (cookies[cookieName]) {
    return cookies[cookieName] === "true";
  }
  const userExpand = currentUser?.expandedFrontpageSections?.[section];
  if (typeof userExpand === "boolean") {
    return userExpand;
  }
  return isDefaultExpanded(currentUser, defaultExpanded);
}

export const useExpandedFrontpageSection = ({
  section,
  defaultExpanded,
  onExpandEvent,
  onCollapseEvent,
  cookieName,
  forceSetCookieIfUndefined,
}: UseExpandedFrontpageSectionProps) => {
  const currentUser = useCurrentUser();
  const [expandFrontpageSection] = useMutation(
    gql`
      mutation UserExpandFrontpageSection($section: String!, $expanded: Boolean!) {
        UserExpandFrontpageSection(section: $section, expanded: $expanded)
      }
    `,
    {errorPolicy: "all"},
  );
  const {captureEvent} = useTracking();
  const [cookies, setCookie] = useCookiesWithConsent([cookieName]);
  const [expanded, setExpanded] = useState(
    () => isInitialExpanded(section, defaultExpanded, currentUser, cookies, cookieName),
  );

  const saveToCookie = useCallback((value: boolean) => {
    if (cookieName) {
      setCookie(cookieName, String(value), {
        expires: moment().add(10, "years").toDate(),
      });
    }
  }, [setCookie, cookieName]);

  const toggleExpanded = useCallback(() => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    if (currentUser) {
      void expandFrontpageSection({
        variables: {
          section,
          expanded: newExpanded,
        },
      });
    }
    saveToCookie(newExpanded);
    const event = newExpanded ? onExpandEvent : onCollapseEvent;
    if (event) {
      captureEvent(event);
    }
  }, [
    section,
    onExpandEvent,
    onCollapseEvent,
    expanded,
    currentUser,
    captureEvent,
    expandFrontpageSection,
    saveToCookie,
  ]);

  useEffect(() => {
    if (forceSetCookieIfUndefined && !cookies[cookieName]) {
      saveToCookie(expanded);
    }
  }, [forceSetCookieIfUndefined, cookies, cookieName, saveToCookie, expanded]);

  return {
    expanded,
    toggleExpanded,
  };
}
