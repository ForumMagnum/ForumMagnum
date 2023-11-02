import { useCallback, useState } from "react";
import { useTracking } from "../../lib/analyticsEvents";
import { useCookiesWithConsent } from "./useCookiesWithConsent";
import moment from "moment";

export const usePersistentToggle = (
  /**
   * The name of the cookie to store the persisted state. This should be
   * created with `registerCookie`.
   */
  cookieName: string,
  /**
   * Default value of this toggle if no cookie is present
   */
  initialValue = false,
  /**
   * The duration for how long the cookie should be stored in months.
   */
  dismissDurationMonths = 120,
) => {
  const {captureEvent} = useTracking();
  const [cookies, setCookie] = useCookiesWithConsent([cookieName]);
  const defaultValue = (cookieName in cookies)
    ? cookies[cookieName]
    : initialValue;

  const [value, setValue] = useState(defaultValue);

  const toggle = useCallback(() => {
    const newValue = !value;
    setValue(newValue);
    setCookie(cookieName, ""+newValue, {
      expires: moment().add(dismissDurationMonths, "months").toDate(),
    });
    captureEvent(`toggled_${cookieName}`, {newValue});
  }, [cookieName, dismissDurationMonths, setCookie, captureEvent, value]);

  return {
    value, toggle,
  };
}
