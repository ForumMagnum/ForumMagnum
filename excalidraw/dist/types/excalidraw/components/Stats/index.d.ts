import type { NonDeletedExcalidrawElement } from "../../../element/src/types";
import "./Stats.scss";
import type { AppClassProperties, AppState, ExcalidrawProps } from "../../types";
interface StatsProps {
    app: AppClassProperties;
    onClose: () => void;
    renderCustomStats: ExcalidrawProps["renderCustomStats"];
}
export declare const Stats: {
    (props: StatsProps): import("react/jsx-runtime").JSX.Element;
    StatsRow: {
        ({ children, columns, heading, style, ...rest }: {
            children: React.ReactNode;
            columns?: number;
            heading?: boolean;
            style?: React.CSSProperties;
        } & React.HTMLAttributes<HTMLDivElement>): import("react/jsx-runtime").JSX.Element;
        displayName: string;
    };
    StatsRows: {
        ({ children, order, style, ...rest }: {
            children: React.ReactNode;
            order?: number;
            style?: React.CSSProperties;
        } & React.HTMLAttributes<HTMLDivElement>): import("react/jsx-runtime").JSX.Element;
        displayName: string;
    };
};
export declare const StatsInner: import("react").MemoExoticComponent<({ app, onClose, renderCustomStats, selectedElements, appState, sceneNonce, gridModeEnabled, }: StatsProps & {
    sceneNonce: number;
    selectedElements: readonly NonDeletedExcalidrawElement[];
    appState: AppState;
    gridModeEnabled: boolean;
}) => import("react/jsx-runtime").JSX.Element>;
export {};
