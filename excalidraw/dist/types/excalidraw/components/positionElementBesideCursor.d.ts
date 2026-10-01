/**
 * Positions an element beside a cursor within a container, flipping the
 * element to the other side of the cursor when it would overflow the
 * container, resolved independently on each axis.
 *
 * Takes the cursor in client (viewport) coordinates and returns
 * container-local coordinates.
 */
export declare const positionElementBesideCursor: ({ cursor, element, container, gap, }: {
    /** client (viewport) coordinates */
    cursor: {
        x: number;
        y: number;
    };
    element: {
        width: number;
        height: number;
    };
    /** the container's bounding client rect */
    container: Pick<DOMRect, "left" | "top" | "width" | "height">;
    /** distance between the cursor and the positioned element */
    gap: number;
}) => {
    left: number;
    top: number;
};
