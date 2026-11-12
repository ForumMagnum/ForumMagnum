import { createContext } from 'react';

// Lets DOM-based enhancements refresh when the body is expanded or edited.
export const ContentItemBodyContext = createContext<string|null>(null);
