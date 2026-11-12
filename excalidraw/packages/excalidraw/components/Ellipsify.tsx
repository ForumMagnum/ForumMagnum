// Vendored from: https://github.com/excalidraw/excalidraw/commit/a52cd200927a975322934b42b966133232724bad
export const Ellipsify = ({
  children,
  ...rest
}: { children: React.ReactNode } & React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      {...rest}
      style={{
        textOverflow: "ellipsis",
        overflow: "hidden",
        whiteSpace: "nowrap",
        ...rest.style,
      }}
    >
      {children}
    </span>
  );
};
