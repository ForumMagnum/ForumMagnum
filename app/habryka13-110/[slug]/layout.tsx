import type { ReactNode } from "react";

import "../styles.css";

type HabrykaLayoutProps = {
  children: ReactNode;
};

export default function HabrykaLayout({ children }: HabrykaLayoutProps) {
  return <div className="habryka-page">{children}</div>;
}
