export const POLL_CLASS = "ck-poll";

export type PollAnswer = { _id: string; text: string };

export type PollProps = {
	question: string;
	agreeWording: string;
	disagreeWording: string;
	colorScheme: { darkColor: string; lightColor: string; bannerTextColor: string };
	duration: { days: number; hours: number; minutes: number };
	/** Set by server when post is published. */
	endDate?: string;
	/** Set by CKEditor when user edits duration on a published poll. Signals server to update endDate. */
	durationEdited?: boolean;
	// When `answers` is present, this poll is a multiple-choice poll rather than
	// the agree/disagree slider. `multiSelect` controls whether voters may pick
	// more than one answer.
	answers?: PollAnswer[];
	multiSelect?: boolean;
};

export const MAX_POLL_ANSWERS = 10;
export const MIN_POLL_ANSWERS = 2;

/**
 * A poll with `answers` is a multiple-choice poll; otherwise it's the
 * agree/disagree slider. Single source of truth for that distinction across the
 * plugin, the form, and the converters.
 */
export function isMultipleChoicePoll(props: PollProps): boolean {
	return Array.isArray(props.answers);
}
