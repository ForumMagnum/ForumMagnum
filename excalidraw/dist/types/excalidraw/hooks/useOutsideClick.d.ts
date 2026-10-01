export declare function useOutsideClick<T extends HTMLElement>(ref: React.RefObject<T | null>, 
/** if performance is of concern, memoize the callback */
callback: (event: Event & {
    target: T;
}) => void, 
/**
 * Optional callback which is called on every click.
 *
 * Should return `true` if click should be considered as inside the container,
 * and `false` if it falls outside and should call the `callback`.
 *
 * Returning `true` overrides the default behavior and `callback` won't be
 * called.
 *
 * Returning `undefined` will fallback to the default behavior.
 */
isInside?: (event: Event & {
    target: T;
}, 
/** the element of the passed ref */
container: T) => boolean | undefined): void;
