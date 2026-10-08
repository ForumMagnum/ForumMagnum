// Vendored from: https://github.com/excalidraw/excalidraw/commit/a52cd200927a975322934b42b966133232724bad
import { FilledButton } from "./FilledButton";

export const LinkButton = ({
  children,
  href,
}: {
  href: string;
  children: React.ReactNode;
}) => {
  return (
    <a href={href} target="_blank" rel="noopener" className="link-button">
      <FilledButton>{children}</FilledButton>
    </a>
  );
};
