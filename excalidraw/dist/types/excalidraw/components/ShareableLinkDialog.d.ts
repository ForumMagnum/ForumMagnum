import "./ShareableLinkDialog.scss";
export type ShareableLinkDialogProps = {
    link: string;
    onCloseRequest: () => void;
    setErrorMessage: (error: string) => void;
};
export declare const ShareableLinkDialog: ({ link, onCloseRequest, setErrorMessage, }: ShareableLinkDialogProps) => import("react/jsx-runtime").JSX.Element;
