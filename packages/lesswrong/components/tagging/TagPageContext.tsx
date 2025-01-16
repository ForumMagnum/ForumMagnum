import type { TagLens } from "@/lib/arbital/useTagLenses";
import { createContext, useContext } from "react";

type TagPageContextPayload = {
  selectedLens: TagLens|null,
}

export const TagPageContext = createContext<TagPageContextPayload|null>(null);

export const useTagPageContext = () => useContext(TagPageContext);
