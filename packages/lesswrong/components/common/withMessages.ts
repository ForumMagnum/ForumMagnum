import React, { useContext } from 'react';
import type { WithMessagesFunctions } from './FlashMessages';

export const MessageFunctionsContext = React.createContext<WithMessagesFunctions|null>(null);

// Hook/HoC that provides access to flash messages stored in context
export const useMessages = (): WithMessagesFunctions => useContext(MessageFunctionsContext)!;
