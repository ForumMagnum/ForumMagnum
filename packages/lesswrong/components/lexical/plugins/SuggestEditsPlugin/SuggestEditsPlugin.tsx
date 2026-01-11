"use client";

/**
 * SuggestEditsPlugin - React wrapper for the SuggestEditsExtension
 *
 * This plugin provides React integration for the suggest edits feature.
 * The actual command registration and logic is handled by SuggestEditsExtension,
 * which is included as a dependency of the main app extension.
 *
 * This component handles:
 * - Configuration initialization via module-level state
 * - Re-exporting mode state getters for React components
 */

import { useEffect } from 'react';
import {
  setSuggestEditsConfig,
  setEnabled,
  type SuggestEditsConfig,
} from './SuggestEditsExtension';

// Re-export for components that need mode state
export {
  getSuggestingMode,
  subscribeModeChange,
} from './SuggestEditsExtension';

interface SuggestEditsPluginProps {
  config?: Partial<SuggestEditsConfig>;
}

/**
 * React plugin that configures the Suggest Edits extension.
 * The extension itself is loaded via the main app extension's dependencies.
 * This component just handles config initialization.
 */
export function SuggestEditsPlugin({ config }: SuggestEditsPluginProps) {
  // Initialize config on mount
  useEffect(() => {
    if (config) {
      setSuggestEditsConfig(config);
      setEnabled(true);
    }
    return () => {
      setEnabled(false);
    };
  }, [config]);

  return null;
}

export default SuggestEditsPlugin;
