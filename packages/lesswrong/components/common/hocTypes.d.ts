
interface WithStylesProps {
  classes: any,
};

type WithMessagesMessage = string|{id?: string, messageString?: string, type?: string};

interface WithMessagesProps {
  messages: Array<WithMessagesMessage>,
  flash: (WithMessagesMessage)=>void,
  clear: ()=>void,
}

interface WithUserProps {
  currentUser: UsersCurrent|null,
}

interface WithTrackingProps {
  captureEvent: any,
}
