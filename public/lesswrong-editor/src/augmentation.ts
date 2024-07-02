import type MathCommand from './ckeditor5-math/mathcommand';
import type { MathConfig } from './ckeditor5-math/math';
import type { InsertCollapsibleSectionCommand } from './collapsible-sections-plugin';

// Augmentations for CkEditor plugins. These are used to determine the types
// if expressions like `editor.commands.get("math")`. (This pattern appears in
// other first- and third-party CkEditor plugins and is the intended mechanism
// for this.)
declare module '@ckeditor/ckeditor5-core' {
  interface EditorConfig {
    math: MathConfig
  }
  interface PluginsMap {
    math: Math
  }
  interface CommandsMap {
    math: MathCommand
    insertCollapsibleSection: InsertCollapsibleSectionCommand
  }
}
