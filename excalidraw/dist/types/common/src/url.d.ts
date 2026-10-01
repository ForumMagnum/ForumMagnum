export declare const normalizeLink: (link: string) => string;
export declare const isLocalLink: (link: string | null) => boolean;
/**
 * Returns URL sanitized and safe for usage in places such as
 * iframe's src attribute or <a> href attributes.
 */
export declare const toValidURL: (link: string) => string;
