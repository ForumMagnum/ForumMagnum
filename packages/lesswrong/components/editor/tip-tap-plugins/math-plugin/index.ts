import { Extension } from "@tiptap/core";

import { InlineMathNode } from "./inline-math-node";
import { DEFAULT_OPTIONS, MathExtensionOption } from "./util/options";

export const MATH_EXTENSION_NAME = "mathExtension";
export const MathExtension = Extension.create<MathExtensionOption>({
  name: MATH_EXTENSION_NAME,

  addOptions() {
    return DEFAULT_OPTIONS;
  },

  addExtensions() {
    const extensions = [];
    if (this.options.addInlineMath !== false) {
      extensions.push(InlineMathNode.configure(this.options));
    }

    return extensions;
  },
});

export { InlineMathNode, DEFAULT_OPTIONS };
export type { MathExtensionOption };
export default MathExtension;