import React from 'react';
import { MessageContext } from 'meteor/vulcan:core';
import { hookToHoc } from '../../lib/hocUtils';

// Hook/HoC that provides access to flash messages stored in context
export const useMessages = (): WithMessagesProps => React.useContext(MessageContext);
export const withMessages = hookToHoc(useMessages);
export default withMessages;
