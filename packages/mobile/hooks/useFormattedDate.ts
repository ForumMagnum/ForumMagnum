import moment from "moment";

export type DateFormatType = "absolute" | "fromNow";

export const useFormattedDate = (
  date: string | Date,
  formatType: DateFormatType = "absolute",
) => {
  const momentDate = moment(date);
  switch (formatType) {
  case "absolute":
    const now = moment();
    const format = now.isSame(momentDate, "year") ? "MMM D" : "MMM D YYYY";
    return momentDate.format(format);
  case "fromNow":
    return momentDate.fromNow();
  }
}
