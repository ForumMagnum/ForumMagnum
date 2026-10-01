import React from "react";
import "./Range.scss";
export type RangeProps = {
    label: React.ReactNode;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    minLabel?: React.ReactNode;
    hasCommonValue?: boolean;
    testId?: string;
};
export declare const Range: ({ label, value, onChange, min, max, step, minLabel, hasCommonValue, testId, }: RangeProps) => import("react/jsx-runtime").JSX.Element;
