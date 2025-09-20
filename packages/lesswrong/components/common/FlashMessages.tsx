import React, { useState, useCallback, ReactNode, useMemo, useContext, type ReactElement, useEffect } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { MessageFunctionsContext } from './withMessages';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { Snackbar } from '../widgets/Snackbar';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { Paper } from '../widgets/Paper';
import { Typography } from "./Typography";

const styles = defineStyles("FlashMessages", (theme) => ({
  root: {
  },
  paper: {
    backgroundColor: theme.palette.panelBackground.default,
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    padding: '6px 24px',
    [theme.breakpoints.up('md')]: {
      minWidth: 288,
      maxWidth: 568,
      borderRadius: 4,
    },
    [theme.breakpoints.down('sm')]: {
      flexGrow: 1,
    },
  },
  message: {
    padding: '8px 0',
    color: theme.palette.text.maxIntensity,
    fontFamily: theme.isFriendlyUI ? theme.palette.fonts.sansSerifStack : undefined,
  },
  action: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: 'auto',
    paddingLeft: 24,
    marginRight: -8,
  },
}));

const messageExpirationTime = 6000
const closeAnimationDelay = 500;

export type WithMessagesMessage = string|{
  messageString?: string|ReactElement,
  type?: "success"|"error"|"failure",
  action?: () => void
  actionName?: string
};

export interface WithMessagesFunctions {
  flash: (message: WithMessagesMessage) => void,
  clear: () => void,
  tick: () => void,
}

type MessagesState = {
  messages: WithMessagesMessage[]
  expiryTimer: ReturnType<typeof setTimeout>|null
  animationState: "opening"|"open"|"closing"|"closed"
};

const MessagesStateContext = React.createContext<MessagesState|null>(null);

export const MessageContextProvider = ({children}: {
  children: ReactNode
}) => {
  const [messages,setMessages] = useState<MessagesState>(() => ({
    messages: [],
    expiryTimer: null,
    animationState: "closed",
  }));
  
  const clear = useCallback(() => {
    setMessages(messages => {
      if (messages.expiryTimer) {
        clearTimeout(messages.expiryTimer);
      }
      if (messages.animationState === "closing") {
        return {
          messages: [],
          expiryTimer: null,
          animationState: "closed",
        };
      } else {
        return {
          messages: messages.messages,
          expiryTimer: setTimeout(clear, closeAnimationDelay),
          animationState: "closing",
        }
      }
    });
  }, []);
  
  const flash = useCallback((message: WithMessagesMessage) => {
    setMessages(messages => {
      if (messages.expiryTimer) {
        clearTimeout(messages.expiryTimer);
      }
      return {
        messages: [
          ...messages.messages,
          message
        ],
        expiryTimer: setTimeout(clear, messageExpirationTime),
        animationState: messages.animationState === "closed" ? "opening" : "open",
      };
    });
  }, [clear]);

  const tick = useCallback(() => {
    setMessages(messages => {
      if (messages.animationState === "opening") {
        return {
          ...messages,
          animationState: "open",
        };
      } else {
        return messages;
      }
    });
  }, []);

  const messagesContext = useMemo(
    () => ({ flash, clear, tick }),
    [flash, clear, tick]
  );

  return <MessageFunctionsContext.Provider value={messagesContext}>
    <MessagesStateContext.Provider value={messages}>
      {children}
    </MessagesStateContext.Provider>
  </MessageFunctionsContext.Provider>
}

const FlashMessages = () => {
  const messagesState = useContext(MessagesStateContext);
  const messagesFunctions = useContext(MessageFunctionsContext);
  const clear = messagesFunctions?.clear;
  const tick = messagesFunctions?.tick;
  const classes = useStyles(styles);
  useEffect(() => {
    if (messagesState?.animationState === "opening") {
      setTimeout(() => tick?.(), 0);
    }
  }, [messagesState?.animationState, tick]);

  if (!messagesState || messagesState.animationState === "closed") {
    return null;
  }

  return (
    <div className={classes.root}>
      <Snackbar open={messagesState.animationState==="open"}>
        <Paper
          square
          elevation={6}
          className={classes.paper}
        >
          <Typography variant="body1">
            {messagesState.messages.map((message,i) => {
              if(typeof message === 'string') {
                return message;
              } else {
                return <div key={i}>
                  {message.messageString}
                  {message.action && <div className={classes.action}>
                    <Button onClick={message.action}>
                      {message.actionName ?? "UNDO"}
                    </Button>
                  </div>}
                </div>
              }
            })}
          </Typography>
        </Paper>
      </Snackbar>
    </div>
  );
}

export default registerComponent('FlashMessages', FlashMessages);


