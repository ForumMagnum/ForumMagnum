import { useEffect, useState } from "react";

export const useHeaderVisible = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const targetNode = document.querySelector(".headroom");
    if (!targetNode) {
      return;
    }
    const mutationObserver = new MutationObserver(() => {
      setVisible(!targetNode.classList.contains("headroom--unpinned"));
    });
    mutationObserver.observe(targetNode, {attributes: true});
    return () => mutationObserver.disconnect();
  }, []);

  return visible;
}
