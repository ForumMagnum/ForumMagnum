export const POLL_CLASS = "ck-poll";

export type PollProps = {
	question: string;
	agreeWording: string;
	disagreeWording: string;
	duration: { days: number; hours: number; minutes: number };
};