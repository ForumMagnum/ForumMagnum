import { createContext, useContext } from "react";
import { PostType } from "./PostsPageCrosspostWrapper";


export type CrosspostContext = {
  hostedHere: boolean;
  localPost: PostType;
  foreignPost?: PostType;
  combinedPost?: PostType;
};
export const crosspostContext = createContext<CrosspostContext | null>(null);

export const useCrosspostContext = () => useContext(crosspostContext);
