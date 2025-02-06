/*
 * Conditional visibility. This is primarily a feature for wiki pages imported
 * from Arbital, but will probably find other uses.
 * 
 */

export type ConditionalVisibilityMode =
  | "unset"
  | "todo"
  | "fixme"
  | "comment"
  | "knowsRequisite"
  | "wantsRequisite"
  | "ifPathBeforeOrAfter"
export type ConditionalVisibilitySettings =
  { inline?: boolean } & (
    | { type: "unset" }
    | { type: "todo" }
    | { type: "fixme" }
    | { type: "comment" }
    | { type: "knowsRequisite", inverted: boolean, otherPage: string }
    | { type: "wantsRequisite", inverted: boolean, otherPage: string }
    | { type: "ifPathBeforeOrAfter", inverted: boolean, order: "before"|"after", otherPage: string }
  );

export const conditionalVisibilityModes: Record<ConditionalVisibilityMode, {
  settings: ConditionalVisibilitySettings,
  label: string
}> = {
  unset: {
    settings: {type: "unset"},
    label: "(Choose a block type)",
  },
  todo: {
    settings: {type: "todo"},
    label: "Todo",
  },
  fixme: {
    settings: {type: "fixme"},
    label: "Fixme",
  },
  comment: {
    settings: {type: "comment"},
    label: "Comment",
  },
  knowsRequisite: {
    settings: {type: "knowsRequisite", inverted: false, otherPage: ""},
    label: "Knows Requisite",
  },
  wantsRequisite: {
    settings: {type: "wantsRequisite", inverted: false, otherPage: ""},
    label: "Wants Requisite",
  },
  ifPathBeforeOrAfter: {
    settings: {type: "ifPathBeforeOrAfter", inverted: false, order: "after", otherPage: ""},
    label: "If Before/After in Path",
  },
}

export type EditConditionalVisibilityProps = {
  initialState: ConditionalVisibilitySettings
  setDocumentState: (newSettings: ConditionalVisibilitySettings) => void
};
export type ConditionalVisibilityPluginConfiguration = {
  renderConditionalVisibilitySettingsInto: (
    element: HTMLElement,
    initalState: ConditionalVisibilitySettings,
    setDocumentState: (newSettings: ConditionalVisibilitySettings) => void
  ) => void,
}

export function isConditionallyVisibleBlockVisibleByDefault(options: ConditionalVisibilitySettings) {
  switch (options.type) {
    case "unset":
    case "todo":
    case "fixme":
    case "comment":
      return false;
    case "knowsRequisite":
    case "wantsRequisite":
    case "ifPathBeforeOrAfter":
      return !!options.inverted;
  }
}

