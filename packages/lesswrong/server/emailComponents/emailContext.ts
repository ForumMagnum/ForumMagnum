import type { JssStyles } from "@/lib/jssStyles";
import type { StyleDefinition } from "../styleGeneration";
import { classNameProxy } from "@/components/hooks/defineStyles";

export const useEmailStyles = <T extends string>(styles: StyleDefinition<T>): JssStyles<T> => {
  if (!styles.nameProxy) {
    styles.nameProxy = classNameProxy(styles.name+"-");
  }
  
  return styles.nameProxy;
}

export interface EmailContextType {
  resolverContext: ResolverContext;
  stylesUsed: Set<StyleDefinition<string, string>>;
  currentUser: UsersCurrent | null;
  // theme: ThemeType;
}

