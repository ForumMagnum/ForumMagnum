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

  // const twentyFourHours = 24 * 60 * 60 * 1000;
  // TODO revert
  const twentyFourHours = 1000;
  if (timeDifference > twentyFourHours) {
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

export function getCachedUserCountryCode() {
  if (isServer) return null;

  const cachedCountryCode = getCountryCodeFromLocalStorage();
  if (cachedCountryCode) {
    return cachedCountryCode;
  }
  return null;
}

export async function getUserCountryCode() {
  if (isServer) return null;

  const cachedCountryCode = getCachedUserCountryCode();
  if (cachedCountryCode) {
    return cachedCountryCode;
  }

  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    const countryCode = data.country;
    setCountryCodeToLocalStorage(countryCode);
    return countryCode;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching user country:', error);
    return null;
  }
}

export function getExplicitConsentRequiredSync(): boolean | "unknown" {
  if (isServer) return "unknown"; // TODO is this right
  if (!isEAForum) return false;

  const cachedCountryCode = getCachedUserCountryCode();
  if (cachedCountryCode) {
    return GDPR_COUNTRY_CODES.includes(cachedCountryCode);
  }
  return "unknown";
}

export async function getExplicitConsentRequiredAsync(): Promise<boolean | "unknown"> {
  if (isServer) return "unknown"; // TODO is this right
  if (!isEAForum) return false;

  const countryCode = await getUserCountryCode();
  if (countryCode) {
    return GDPR_COUNTRY_CODES.includes(countryCode);
  }
  return "unknown";
}
