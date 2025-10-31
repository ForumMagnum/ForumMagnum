let currencies: Record<string, number> = {};
let lastFetchedAt = 0;

const fetchCurrencies = async (isRetry = false): Promise<Record<string, number>> => {
  // See https://github.com/fawazahmed0/exchange-api
  const response = await fetch(
    isRetry
      ? "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json"
      : "https://latest.currency-api.pages.dev/v1/currencies/usd.min.json",
  );
  const result = await response.json();
  if (!result.usd) {
    throw new Error("Failed to fetch currencies");
  }
  return result.usd;
}

const refreshCurrencies = async () => {
  for (let retries = 0; retries < 3; retries++) {
    try {
      const result = await fetchCurrencies(retries > 0);
      currencies = result;
      lastFetchedAt = Date.now();
      return;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`Error fetching currencies (attempt ${retries + 1})`, e);
    }
  }
}

const TWO_HOURS_MS = 7200000;

export const getExchangeRate = async (currency: string): Promise<number> => {
  currency = currency.toLowerCase();
  if (currency === "usd") {
    return 1;
  }
  if (Date.now() - lastFetchedAt > TWO_HOURS_MS) {
    await refreshCurrencies();
  }
  return currencies[currency] ?? 1;
}
