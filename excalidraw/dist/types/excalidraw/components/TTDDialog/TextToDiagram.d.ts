import type { MermaidToExcalidrawLibProps, TTDPersistenceAdapter, TTTDDialog } from "./types";
export declare const TextToDiagram: ({ mermaidToExcalidrawLib, onTextSubmit, renderWelcomeScreen, renderWarning, persistenceAdapter, }: {
    mermaidToExcalidrawLib: MermaidToExcalidrawLibProps;
    onTextSubmit(props: TTTDDialog.OnTextSubmitProps): Promise<TTTDDialog.OnTextSubmitRetValue>;
    renderWelcomeScreen?: TTTDDialog.renderWelcomeScreen;
    renderWarning?: TTTDDialog.renderWarning;
    persistenceAdapter: TTDPersistenceAdapter;
}) => import("react/jsx-runtime").JSX.Element;
export default TextToDiagram;
