
type ClassesType = Record<string,any>

interface WithStylesProps {
  classes: ClassesType,
};

type WithMessagesMessage = string|{messageString?: string, type?: string, action?: any};

interface WithMessagesProps {
  messages: Array<WithMessagesMessage>,
  flash: (message: WithMessagesMessage)=>void,
  clear: ()=>void,
}

interface WithUserProps {
  currentUser: UsersCurrent|null,
}

interface WithTrackingProps {
  captureEvent: any,
}

interface WithTimezoneProps {
  timezone: string,
  timezoneIsKnown: boolean,
}

interface WithNavigationProps {
  history: any,
}

interface WithLocationProps {
  location: any,
}

interface WithDialogProps {
  openDialog: any,
}

interface WithGlobalKeydownProps {
  addKeydownListener: any,
}

interface WithHoverProps {
  hover: boolean,
  anchorEl: HTMLElement|null,
  stopHover: ()=>void,
}

interface WithApolloProps {
  client: any;
}

type WithUpdateFunction<T extends CollectionBase> = any;

interface WithUpdateUserProps {
  updateUser: WithUpdateFunction<UsersCollection>
}
interface WithUpdateCommentProps {
  updateComment: WithUpdateFunction<CommentsCollection>
}
interface WithUpdatePostProps {
  updatePost: WithUpdateFunction<PostsCollection>
}
