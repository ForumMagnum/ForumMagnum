import { isServer } from "../../../lib/executionEnvironment";
import { DatabasePublicSetting, hasCookieConsentSetting } from "../../../lib/publicSettings";
import { getBrowserLocalStorage } from "../../editor/localStorageHandlers";
import { safeLocalStorage } from "../../../lib/utils/safeLocalStorage";

const ipApiKeySetting = new DatabasePublicSetting<string | null>('ipapi.apiKey', null);

const GDPR_COUNTRY_CODES: string[] = [
  "AT", // Austria
  "BE", // Belgium
  "BG", // Bulgaria
  "HR", // Croatia
  "CY", // Cyprus
  "CZ", // Czech Republic
  "DK", // Denmark
  "EE", // Estonia
  "FI", // Finland
  "FR", // France
  "DE", // Germany
  "GR", // Greece
  "HU", // Hungary
  "IE", // Ireland
  "IT", // Italy
  "LV", // Latvia
  "LT", // Lithuania
  "LU", // Luxembourg
  "MT", // Malta
  "NL", // Netherlands
  "PL", // Poland
  "PT", // Portugal
  "RO", // Romania
  "SK", // Slovakia
  "SI", // Slovenia
  "ES", // Spain
  "SE", // Sweden
  "GB", // United Kingdom
];

function getCountryCodeFromLocalStorage(): string | null {
  const cachedCountryCode = safeLocalStorage.getItem('countryCode');
  const cachedTimestamp = safeLocalStorage.getItem('countryCodeTimestamp');

  if (!cachedCountryCode || !cachedTimestamp) {
    return null;
  }

  const currentTime = new Date().getTime();
  const timeDifference = currentTime - parseInt(cachedTimestamp);

  // 48 hours
  const cacheTTL = 48 * 60 * 60 * 1000;
  if (timeDifference > cacheTTL) {
    safeLocalStorage.removeItem('countryCode');
    safeLocalStorage.removeItem('countryCodeTimestamp');
    return null;
  }

  return cachedCountryCode;
}

function setCountryCodeToLocalStorage(countryCode: string) {
  const timestamp = new Date().getTime();
  safeLocalStorage.setItem('countryCode', countryCode);
  safeLocalStorage.setItem('countryCodeTimestamp', timestamp.toString());
}

export function getCachedUserCountryCode() {
  if (isServer) return null;

  const cachedCountryCode = getCountryCodeFromLocalStorage();
  if (cachedCountryCode) {
    return cachedCountryCode;
  }
  return null;
}

let inFlightRequest: Promise<string | null> | null = null;

async function getUserCountryCode({ signal }: { signal?: AbortSignal } = {}): Promise<string | null> {
  if (isServer) return null;

  const cachedCountryCode = getCachedUserCountryCode();
  if (cachedCountryCode) {
    return cachedCountryCode;
  }

  if (inFlightRequest) {
    // If there's an in-flight request, wait for it to finish and return the result
    const countryCode = await inFlightRequest;
    return countryCode;
  }

  const apiKey = ipApiKeySetting.get();
  const ipapiUrl = apiKey ? `https://ipapi.co/json/?key=${apiKey}` : 'https://ipapi.co/json/';

  inFlightRequest = (async () => {
    try {
      const response = await fetch(ipapiUrl, { signal });

      if (!response.ok) {
        throw new Error(`Error fetching user country: ${response.statusText}`);
      }

      const data = await response.json();
      const countryCode = data.country;
      setCountryCodeToLocalStorage(countryCode);
      return countryCode;
    } finally {
      // Reset the in-flight request to null after completion
      inFlightRequest = null;
    }
  })();

  const countryCode = await inFlightRequest;
  return countryCode;
}

export function getExplicitConsentRequiredSync(): boolean | "unknown" {
  if (!hasCookieConsentSetting.get()) return false;
  if (isServer) return "unknown";

  const cachedCountryCode = getCachedUserCountryCode();
  if (cachedCountryCode) {
    return GDPR_COUNTRY_CODES.includes(cachedCountryCode);
  }
  return "unknown";
}

export async function getExplicitConsentRequiredAsync(): Promise<boolean | "unknown"> {
  if (!hasCookieConsentSetting.get()) return false;
  if (isServer) return "unknown";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const countryCode = await getUserCountryCode({ signal: controller.signal });
    clearTimeout(timeoutId);

    if (countryCode) {
      return GDPR_COUNTRY_CODES.includes(countryCode);
    }
    return true;
  } catch (error) {
    clearTimeout(timeoutId);

    // If there is any error (such as due to timing out), assume consent IS required
    return true;
  }
}
