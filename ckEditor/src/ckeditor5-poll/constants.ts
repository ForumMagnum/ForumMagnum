export const POLL_CLASS = "ck-poll";

export type PollProps = {
  question: string,
  agreeWording: string,
  disagreeWording: string,
  /** Time from publishing to poll close, ms */
  endDt: number
}