import React from "react";
import "./QuickSearch.scss";
interface QuickSearchProps {
    className?: string;
    placeholder: string;
    onChange: (term: string) => void;
}
export declare const QuickSearch: React.ForwardRefExoticComponent<QuickSearchProps & React.RefAttributes<HTMLInputElement>>;
export {};
