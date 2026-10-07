
export const ALLOWABLE_COLLECTIONS: TemplateType[] = ["Messages", "Comments", "Rejections"];

export type TemplateType = "Messages" | "Comments" | "Rejections";

// LWEvents name logged once per template each time a moderator uses it; the
// event's documentId is the template's _id
export const MODERATION_TEMPLATE_USED_EVENT = "moderationTemplateUsed";
