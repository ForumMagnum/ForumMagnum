export const useGetParameter = (name: string) => {
  for (const token of location.search.substr(1).split("&")) {
    const [key, value] = token.split("=");
    if (key === name) {
      return value;
    }
  }
}
