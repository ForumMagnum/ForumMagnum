// Shared regex for the `<system-reminder>` wrapper the server prepends to
// agent-turn user prompts. Lives in `lib/` so the client display strip and
// the server prep/parse helpers can use the exact same source of truth.
export const LEADING_SYSTEM_REMINDER_REGEX = /^<system-reminder\b[^>]*>[\s\S]*?<\/system-reminder>\n\n/;

export function stripLeadingSystemReminder(text: string): string {
  return text.replace(LEADING_SYSTEM_REMINDER_REGEX, '');
}
