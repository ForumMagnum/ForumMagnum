import { type EditorInterface } from "../../../common/src/index";
import "./LiveCollaborationTrigger.scss";
declare const LiveCollaborationTrigger: {
    ({ isCollaborating, onSelect, editorInterface, ...rest }: {
        isCollaborating: boolean;
        onSelect: () => void;
        editorInterface?: EditorInterface;
    } & React.ButtonHTMLAttributes<HTMLButtonElement>): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
export default LiveCollaborationTrigger;
