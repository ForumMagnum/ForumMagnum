import React, { useContext } from 'react';
import { hookToHoc } from '../../lib/hocUtils';
import { WithMessagesFunctions } from './FlashMessages';

export const MessageFunctionsContext = React.createContext<WithMessagesFunctions|null>(null);

// Hook/HoC that provides access to flash messages stored in context
export const useMessages = (): WithMessagesFunctions => useContext(MessageFunctionsContext)!;
export const withMessages = hookToHoc(useMessages);
export default withMessages;
