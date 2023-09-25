import { useEffect, useState } from "react";

type HeaderVisibility = {
  headerVisible: boolean,
  headerAtTop: boolean,
}

export const useHeaderVisible = (): HeaderVisibility => {
  const [visible, setVisible] = useState<HeaderVisibility>({
    headerVisible: true,
    headerAtTop: true,
  });

  useEffect(() => {
    const targetNode = document.querySelector(".headroom");
    if (!targetNode) {
      return;
    }
    const mutationObserver = new MutationObserver(() => {
      setVisible({
        headerVisible: !targetNode.classList.contains("headroom--unpinned"),
        headerAtTop: targetNode.classList.contains("headroom--unfixed"),
      });
    });
    mutationObserver.observe(targetNode, {attributes: true});
    return () => mutationObserver.disconnect();
  }, []);

  return visible;
}
