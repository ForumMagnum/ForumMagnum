
export const surveyScheduleTargets = [
  { value: "allUsers", label: "All users" },
  { value: "loggedInOnly", label: "Logged-in users only" },
  { value: "loggedOutOnly", label: "Logged-out users only" },
] as const;

export type SurveyScheduleTarget = (typeof surveyScheduleTargets)[number]["value"];
