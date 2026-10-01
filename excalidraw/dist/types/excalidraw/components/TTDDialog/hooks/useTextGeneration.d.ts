import type { TTTDDialog } from "../types";
export declare const useTextGeneration: ({ onTextSubmit, }: {
    onTextSubmit: (props: TTTDDialog.OnTextSubmitProps) => Promise<TTTDDialog.OnTextSubmitRetValue>;
}) => {
    onGenerate: TTTDDialog.OnGenerate;
    handleAbort: () => void;
};
