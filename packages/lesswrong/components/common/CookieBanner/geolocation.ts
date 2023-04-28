// TODO move to lib
import { isServer } from "../../../lib/executionEnvironment";
import { isEAForum } from "../../../lib/instanceSettings";

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

function getCountryCodeFromLocalStorage() {
  const cachedCountryCode = localStorage.getItem('countryCode');
  const cachedTimestamp = localStorage.getItem('countryCodeTimestamp');

  if (!cachedCountryCode || !cachedTimestamp) {
    return null;
  }

  const currentTime = new Date().getTime();
  const timeDifference = currentTime - parseInt(cachedTimestamp);

  // 24 hours
  const cacheTTL = 24 * 60 * 60 * 1000;
  if (timeDifference > cacheTTL) {
    localStorage.removeItem('countryCode');
    localStorage.removeItem('countryCodeTimestamp');
    return null;
  }

  return cachedCountryCode;
}

function setCountryCodeToLocalStorage(countryCode: string) {
  const timestamp = new Date().getTime();
  localStorage.setItem('countryCode', countryCode);
  localStorage.setItem('countryCodeTimestamp', timestamp.toString());
}

function getCachedUserCountryCode() {
  if (isServer) return null;

  const cachedCountryCode = getCountryCodeFromLocalStorage();
  if (cachedCountryCode) {
    return cachedCountryCode;
  }
  return null;
}

async function getUserCountryCode({ signal }: { signal?: AbortSignal } = {}): Promise<string | null> {
  if (isServer) return null;

  const cachedCountryCode = getCachedUserCountryCode();
  if (cachedCountryCode) {
    return cachedCountryCode;
  }

  const response = await fetch('https://ipapi.co/json/', { signal });

  if (!response.ok) {
    throw new Error(`Error fetching user country: ${response.statusText}`);
  }

  const data = await response.json();
  const countryCode = data.country;
  setCountryCodeToLocalStorage(countryCode);
  return countryCode;
}

export function getExplicitConsentRequiredSync(): boolean | "unknown" {
  if (isServer) return "unknown";
  if (!isEAForum) return false;

  const cachedCountryCode = getCachedUserCountryCode();
  if (cachedCountryCode) {
    return GDPR_COUNTRY_CODES.includes(cachedCountryCode);
  }
  return "unknown";
}

export async function getExplicitConsentRequiredAsync(): Promise<boolean | "unknown"> {
  if (isServer) return "unknown";
  if (!isEAForum) return false;

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

