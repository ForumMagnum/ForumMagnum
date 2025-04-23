export const POLL_CLASS = "ck-poll";

export type PollProps = {
	question: string;
	agreeWording: string;
	disagreeWording: string;
  colorScheme: { darkColor: string; lightColor: string; bannerTextColor: string }
	duration: { days: number; hours: number; minutes: number };
};