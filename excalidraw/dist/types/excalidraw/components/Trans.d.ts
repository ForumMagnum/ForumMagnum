import React from "react";
import type { TranslationKeys } from "../i18n";
declare const Trans: ({ i18nKey, children, ...props }: {
    i18nKey: TranslationKeys;
    [key: string]: React.ReactNode | ((el: React.ReactNode) => React.ReactNode);
}) => React.FunctionComponentElement<{
    children?: React.ReactNode | undefined;
}>;
export default Trans;
