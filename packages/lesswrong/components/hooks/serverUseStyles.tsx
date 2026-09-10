import type { ForumTypeString } from '@/lib/instanceSettings';
import type { ClassNameProxy, StyleDefinition } from "@/server/styleGeneration";
import { classNameProxy } from "./defineStyles";
import type { AbstractThemeOptions } from "@/themes/themeNames";
import { styleDefinitionToCSS } from "./serverEmbeddedStyles";

/**
 * Use JSS styles, similar to useStyles but for use in server-components. Returns { classes, styleTag };
 * if you use any of the classnames in `classes`, you must include `styleTag` in the resulting DOM tree
 * at least once (more-than-once is harmless). Eg:
 *
 *   const styles = defineStyles("MyServerComponent", theme => ({
 *     root: {
 *       padding: 16,
 *     }
 *   }), { stylePriority: 0 });
 *   function MyServerComponent() {
 *     const { classes, styleTag } = serverUseStyles(styles, context.forumType);
 *     return <div className={classes.root}>
 *       {styleTag}
 *     </div>
 *   }
 *
 * `styleTag` creates a <style> node, which is hoisted into the <head> block and deduplicated with any
 * other style tags with the name MyServerComponent. Note that while stylePriority works for tiebreaking
 * specificity between server-component styles, server-component styles always win over client-component
 * styles if they have the same specificity.
 */
export function serverUseStyles<T extends string>(styles: StyleDefinition<T>, forumType: ForumTypeString): {
  classes: ClassNameProxy<T>;
  styleTag: React.ReactNode;
} {
  if (!styles.nameProxy) {
    styles.nameProxy = classNameProxy(styles.name+"-");
  }
  const themeOptions: AbstractThemeOptions = { name: "auto" };
  const precedence = `${styles.options?.stylePriority ?? 0}-${styles.name}`;
  const styleStr = styleDefinitionToCSS(themeOptions, styles, forumType);
  // eslint-disable-next-line react/no-unknown-property
  const styleTag = <style href={`${forumType}-${styles.name}`} precedence={precedence}>{styleStr}</style>;
  return {
    classes: styles.nameProxy!,
    styleTag
  };
}
