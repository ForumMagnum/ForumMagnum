// Vendored from: https://github.com/excalidraw/excalidraw/commit/a52cd200927a975322934b42b966133232724bad
import clsx from "clsx";

import { useTunnels } from "../../context/tunnels";
import { useUIAppState } from "../../context/ui-appState";

import "./FooterCenter.scss";

const FooterCenter = ({ children }: { children?: React.ReactNode }) => {
  const { FooterCenterTunnel } = useTunnels();
  const appState = useUIAppState();
  return (
    <FooterCenterTunnel.In>
      <div
        className={clsx("footer-center zen-mode-transition", {
          "layer-ui__wrapper__footer-left--transition-bottom":
            appState.zenModeEnabled,
        })}
      >
        {children}
      </div>
    </FooterCenterTunnel.In>
  );
};

export default FooterCenter;
FooterCenter.displayName = "FooterCenter";
