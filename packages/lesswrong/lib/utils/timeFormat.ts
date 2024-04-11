
export const formatRelative = (
  date: Date | string,
  now: Date,
  includeAgo?: boolean,
): string => {
  const formatted = formatRelativeFast(new Date(date), now);
  return includeAgo && formatted !== "now" ? formatted + " ago" : formatted;
}

const formatRelativeFast = (date: Date, now: Date): string => {
  const msApart = Math.abs(now.getTime() - date.getTime());
  const secondsApart = msApart / 1000;
  if (secondsApart < 44) {
    return "now";
  } else if (secondsApart < 45*60) {
    const minutes = Math.round(secondsApart/60.0);
    return `${minutes}m`;
  } else if (secondsApart < 22*60*60) {
    const hours = Math.round(secondsApart/(60.0*60.0));
    return `${hours}h`;
  } else if (secondsApart < 26*24*60*60) {
    const days = Math.round(secondsApart/(24*60*60.0));
    return `${days}d`;
  } else if (secondsApart < 335*24*60*60) {
    const months = Math.round(secondsApart/(30.4*24*60*60.0));
    return `${months}mo`;
  } else {
    const years = Math.round(secondsApart/(365*24*60*60.0));
    return `${years}y`;
  }
}
