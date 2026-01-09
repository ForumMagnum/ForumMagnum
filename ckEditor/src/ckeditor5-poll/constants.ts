export const POLL_CLASS = "ck-poll";

export type PollProps = {
	question: string;
	agreeWording: string;
	disagreeWording: string;
	colorScheme: { darkColor: string; lightColor: string; bannerTextColor: string };
	duration: { days: number; hours: number; minutes: number };
	/** Set by server when post is published. Used to compute remaining time. */
	endDate?: string;
	/** Set by CKEditor when user edits duration on a published poll. Signals server to update endDate. */
	durationEdited?: boolean;
};