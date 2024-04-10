import React, { useState, useCallback, ReactNode, useMemo } from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { MessageContext, useMessages } from './withMessages';
import classnames from 'classnames';
import Snackbar from '@material-ui/core/Snackbar';
import Button from '@material-ui/core/Button';
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    '& .MuiSnackbarContent-message': {
      color: theme.palette.text.maxIntensity,
      fontFamily: isFriendlyUI ? theme.palette.fonts.sansSerifStack : undefined,
    },
  },
});

export const MessageContextProvider = ({children}: {
  children: ReactNode
}) => {
  const [messages,setMessages] = useState<AnyBecauseTodo[]>([]);
  
  const flash = useCallback((message: AnyBecauseTodo) => {
    setMessages([...messages, message]);
  }, [messages]);

  const clear = useCallback(() => {
    setMessages(messages.map((message: AnyBecauseTodo) => ({...message, hide:true})));
    setTimeout(() => {
      setMessages([]);
    }, 500);
  }, [messages]);

  const messagesContext = useMemo(
    () => ({ messages, flash, clear }),
    [messages, flash, clear]
  );

  // FIXME: While this is mostly referentially stable, MessageContext will change
  // when flash-messages are added or removed. This means that when a flash-message
  // is added, every component on the page that called useMessages() will rerender,
  // even if it was intended to be send-only. That includes a lot of components
  // including vote buttons, so on a page with a lot of comments, this can be
  // very slow.
  
  return <MessageContext.Provider value={messagesContext}>
    {children}
  </MessageContext.Provider>
}

const FlashMessages = ({classes}: {
  classes: ClassesType,
}) => {
  const getProperties = (message: WithMessagesMessage) => {
    if (typeof message === 'string') {
      // if error is a string, use it as message
      return {
        message: message,
        type: 'error'
      }
    } else {
      // else return full error object after internationalizing message
      const { messageString } = message;
      return {
        ...message,
        message: messageString,
      };
    }
  }

  const { messages, clear } = useMessages();
  let messageObject = messages.length > 0 ? getProperties(messages[0]) : undefined;
  return (
    <div className={classnames("flash-messages", classes.root)}>
      <Snackbar
        // @ts-ignore there is no hide property on the message props!
        open={!!messageObject && !messageObject.hide}
        message={messageObject && messageObject.message}
        autoHideDuration={6000}
        onClose={clear}
        action={
          messageObject?.action &&
          <Button
            onClick={messageObject?.action}
            color="primary"
          >
            {/* @ts-ignore there is no actionName property on the message props! */}
            {messageObject?.actionName || "UNDO"}
          </Button>
        }
      />
    </div>
  );
}

const FlashMessagesComponent = registerComponent('FlashMessages', FlashMessages, {styles});

declare global {
  interface ComponentTypes {
    FlashMessages: typeof FlashMessagesComponent
  }
}
