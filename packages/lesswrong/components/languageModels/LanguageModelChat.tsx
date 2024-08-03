// TODO: Import component in components.ts
import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { gql, useMutation } from '@apollo/client';
import classNames from 'classnames';
import { getBrowserLocalStorage } from '../editor/localStorageHandlers';
import DeferRender from '../common/DeferRender';
import Checkbox from "@material-ui/core/Checkbox";

const styles = (theme: ThemeType) => ({
  root: {
  },
  mainColumn: {
    width: 600
  },
  chatInterfaceRoot: {

  },
  submission: {
    width: "100%",
    display: "flex",
  },
  inputTextbox: {
    width: "100%",
    minHeight: 100,
    maxHeight: 200,
  },
  chatMessage: {
    ...theme.typography.commentStyle,
    padding: 20,
    margin: 10,
    borderRadius: 10,
  },
  userMessage: {
    backgroundColor: theme.palette.grey[300],
  },
  assistantMessage: {
    backgroundColor: theme.palette.grey[200],
  },
  options: {

  }
});

interface ClaudeMessage {
  role: string
  content: string
}


const LLMChatMessage = ({message, classes}: {
  message: ClaudeMessage,
  classes: ClassesType<typeof styles>,
}) => {

  const { role, content } = message

  return <div className={classNames(classes.chatMessage, {[classes.userMessage]: role==='user', [classes.assistantMessage]: role==='assistant'})}>
    {`${content}`}
  </div>
}


export const ChatInterface = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components

  const [sendClaudeMessage] = useMutation(gql`
    mutation sendClaudeMessageMutation($messages: [ClaudeMessage!]!) {
      sendClaudeMessage(messages: $messages)
    }
  `)

  const ls = getBrowserLocalStorage();
  const storedChatHistory = ls?.getItem('llmChatHistory');
  const initialConversationHistory = storedChatHistory ? JSON.parse(storedChatHistory) : []

  const [useRAG, setUseRAG] = useState(false)

  const [currentMessage, setCurrentMessage] = useState('')
  const [conversationHistory, setConversationHistory] = useState<ClaudeMessage[]>(initialConversationHistory)

  const messages = <div>
    {conversationHistory.map((message, index) => (
      <LLMChatMessage key={index} message={message} classes={classes} />
    ))}
  </div>

  const messageSubmit = async () => {
    let newMessage = { role: "user", content: currentMessage }

    if (!conversationHistory.length && useRAG) {
      newMessage = createPromptWithContext(currentMessage)
    }

    const updatedConversationHistory = [...conversationHistory, newMessage]
    setConversationHistory(updatedConversationHistory)
    setCurrentMessage("")
  
    setTimeout(async () => {
      const result = await sendClaudeMessage({
        variables: {
          messages: updatedConversationHistory
        }
      })

      const response = result.data.sendClaudeMessage
      const conversationHistoryWithNewResponse = [...updatedConversationHistory, { role: "assistant", content: response }]
      setConversationHistory(conversationHistoryWithNewResponse)
      ls?.setItem('llmChatHistory', JSON.stringify(conversationHistoryWithNewResponse))
    }, 0)

  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.keyCode === 13) {
      event.stopPropagation();
      event.preventDefault();
      void messageSubmit();
    }
  }

  const clearChatHistory = () => {
    ls?.removeItem('llmChatHistory')
    setConversationHistory([])
  }
  
  const input = (
    <div className={classes.submission}>
      <textarea 
        value={currentMessage} 
        onChange={(event) => setCurrentMessage(event.target.value)} 
        onKeyDown={handleKeyDown} 
        className={classes.inputTextbox} 
        draggable={false}
      />
    </div>
  )

  const options = <div className={classes.options}>
    <button onClick={clearChatHistory}>
      Clear History
    </button>
    {/* checkbox to toggle RAG */}
    Use RAG <Checkbox checked={useRAG} onChange={() => setUseRAG(!useRAG)} />
  </div>


  return <div className={classes.chatInterfaceRoot}>
    {messages}
    {input}
    {options}
  </div>
}


export const LanguageModelChat = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {

  const { SingleColumnSection } = Components

  return <DeferRender ssr={false}>
    <div className={classes.root}>
      <SingleColumnSection className={classes.mainColumn}>
        <ChatInterface classes={classes} />
      </SingleColumnSection>
    </div>
  </DeferRender>
}

const LanguageModelChatComponent = registerComponent('LanguageModelChat', LanguageModelChat, {styles});

declare global {
  interface ComponentTypes {
    LanguageModelChat: typeof LanguageModelChatComponent
  }
}
