export const capitalize = (value: string): string => {
  if (!value) {
    return value;
  }
  return value[0].toUpperCase() + value.slice(1);
};
