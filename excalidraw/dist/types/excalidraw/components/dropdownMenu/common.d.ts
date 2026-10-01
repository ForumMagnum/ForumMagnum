import React from "react";
export declare const DropdownMenuContentPropsContext: React.Context<{
    onSelect?: (event: Event) => void;
}>;
export declare const getDropdownMenuItemClassName: (className?: string, selected?: boolean, hovered?: boolean) => string;
export declare const useHandleDropdownMenuItemSelect: (onSelect: ((event: Event) => void) | undefined) => (event: Event) => void;
