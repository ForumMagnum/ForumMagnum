import { useState } from "react";
import { useCurrentUser } from "../common/withUser";
import { useUpdateCurrentUser } from "./useUpdateCurrentUser";
import { useTracking } from "../../lib/analyticsEvents";
import { useCookies } from "react-cookie";
import moment from "moment";

export type ExpandedFrontpageSections = NonNullable<DbUser["expandedFrontpageSections"]>;
export type ExpandedFrontpageSection = keyof ExpandedFrontpageSections;
export type DefaultExpandedType = "all" | "none" | "loggedIn";

export type UseExpandedFrontpageSectionProps = {
  section: ExpandedFrontpageSection,
  defaultExpanded: DefaultExpandedType,
  onExpandEvent?: string,
  onCollapseEvent?: string,
  cookieName?: string,
}

const isDefaultExpanded = (
  currentUser: UsersCurrent | null,
  defaultExpanded: DefaultExpandedType,
): boolean => {
  switch (defaultExpanded) {
  case "none":
      return false;
  case "all":
      return true;
  case "loggedIn":
      return !!currentUser;
  }
}

export const useExpandedFrontpageSection = ({
  section,
  defaultExpanded,
  onExpandEvent,
  onCollapseEvent,
  cookieName,
}: UseExpandedFrontpageSectionProps) => {
  cookieName ??= `expand_frontpage_section_${section}`;

  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const {captureEvent} = useTracking();
  const [cookies, setCookie, removeCookie] = useCookies([cookieName]);

  const userExpand = currentUser?.expandedFrontpageSections?.[section];
  const cookieExpand = cookies[cookieName];
  const defaultExpand = isDefaultExpanded(currentUser, defaultExpanded);
  const initialExpanded = userExpand ?? cookieExpand ?? defaultExpand ?? false;
  const [expanded, setExpanded] = useState(initialExpanded);

  const toggleExpanded = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    if (currentUser) {
      void updateCurrentUser({
        expandedFrontpageSections: {
          ...currentUser?.expandedFrontpageSections,
          [section]: expanded,
        } as ExpandedFrontpageSections,
      });
    }
    if (newExpanded && cookieName) {
      setCookie(cookieName, "true", {expires: moment().add(10, "years").toDate()});
    } else if (cookieName) {
      removeCookie(cookieName);
    }
    const event = newExpanded ? onExpandEvent : onCollapseEvent;
    if (event) {
      captureEvent(event);
    }
  }

  return {
    expanded,
    toggleExpanded,
  };
}
