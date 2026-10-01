export declare const isMermaidParseSyntaxError: (message: string) => boolean;
export declare const isMermaidAutoFixableError: (message: string) => boolean;
export declare const isMermaidCaretLine: (line: string) => boolean;
export declare const getMermaidInactiveParticipant: (message: string) => string | null;
export declare const getMermaidErrorLineNumber: (message: string, sourceText?: string) => number | null;
export declare const getMermaidSyntaxErrorGuidance: (message: string, sourceText?: string) => {
    summary: string;
    likelyCauses: string[];
} | null;
export declare const formatMermaidParseErrorMessage: (message: string) => string;
