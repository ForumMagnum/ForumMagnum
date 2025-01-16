import type { TagLens } from "@/lib/arbital/useTagLenses";
import { createContext, useContext } from "react";

type TagPageContextPayload = {
  tag: TagPageFragment|null,
  selectedLens: TagLens|null,
  editing: boolean,
  setEditing: (editing: boolean, warnBeforeClosing?: boolean) => void
}

export const TagPageContext = createContext<TagPageContextPayload|null>(null);

export const useTagPageContext = () => useContext(TagPageContext);