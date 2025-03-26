import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { DatabasePublicSetting } from "@/lib/publicSettings";

export const buttonBurstSetting = new DatabasePublicSetting<boolean>("buttonBurst.enabled", false);
const buttonBurstImage = new DatabasePublicSetting<string>("buttonBurst.image", "https://res.cloudinary.com/cea/image/upload/w_256,h_256,q_40,f_auto,dpr_1/v1711484824/bulby-canonical.png");

function onIdle(fn: () => void) {
  if (typeof (window as any).requestIdleCallback === "function") {
    (window as any).requestIdleCallback(fn);
  } else {
    setTimeout(fn, 0);
  }
}

const PNG_COUNT = 10;

function randomBetween(min: number, max: number) {
  return (Math.random() * (max - min)) + min;
}

interface BurstItem {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  rotate: number;
  scale: number;
}

/**
 * Observe the entire DOM for <button> additions/removals. Any click on a button
 * triggers a radial "burst" of images from the click position. Do this via
 * requestIdleTimeout to try to avoid a performance hit
 */
export default function GlobalButtonBursts() {
  const [bursts, setBursts] = useState<BurstItem[]>([]);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes fly-out {
        0% {
          transform: translate(0px, 0px) rotate(0deg) scale(1);
          opacity: 1;
        }
        100% {
          transform: var(--transform);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);

    onIdle(() => {
      const attachedButtons = new WeakMap<HTMLButtonElement, EventListener>();

      function handleClick(ev: MouseEvent) {
        const btn = ev.currentTarget as HTMLButtonElement | null;
        if (!btn) return;

        const centerX = ev.clientX;
        const centerY = ev.clientY;

        const newItems: BurstItem[] = Array.from({ length: PNG_COUNT }).map(() => {
          const id = Math.random().toString(36).substring(2, 11);
          const angle = randomBetween(0, 2 * Math.PI);
          const distance = randomBetween(80, 180);

          const endX = centerX + (distance * Math.cos(angle));
          const endY = centerY + (distance * Math.sin(angle));

          return {
            id,
            startX: centerX,
            startY: centerY,
            endX,
            endY,
            rotate: randomBetween(0, 360),
            scale: randomBetween(0.5, 1.2),
          };
        });

        setBursts((prev) => [...prev, ...newItems]);

        setTimeout(() => {
          setBursts((prev) =>
            prev.filter((b) => !newItems.some((ni) => ni.id === b.id))
          );
        }, 1000);
      }

      function attachListener(btn: HTMLButtonElement) {
        if (!attachedButtons.has(btn)) {
          const fn: EventListener = (evt) => handleClick(evt as MouseEvent);
          btn.addEventListener("click", fn, { passive: true });
          attachedButtons.set(btn, fn);
        }
      }

      function detachListener(btn: HTMLButtonElement) {
        const fn = attachedButtons.get(btn);
        if (fn) {
          btn.removeEventListener("click", fn);
          attachedButtons.delete(btn);
        }
      }

      function attachAllButtonsIn(root: ParentNode) {
        const allBtns = root.querySelectorAll("button");
        allBtns.forEach((btn) => attachListener(btn as HTMLButtonElement));
      }

      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.type === "childList") {
            m.addedNodes.forEach((node) => {
              if (node instanceof HTMLElement) {
                if (node.tagName.toLowerCase() === "button") {
                  attachListener(node as HTMLButtonElement);
                }
                attachAllButtonsIn(node);
              }
            });
            m.removedNodes.forEach((node) => {
              if (node instanceof HTMLElement) {
                if (node.tagName.toLowerCase() === "button") {
                  detachListener(node as HTMLButtonElement);
                }
                const removedBtns = node.querySelectorAll("button");
                removedBtns.forEach((b) => detachListener(b as HTMLButtonElement));
              }
            });
          }
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
      attachAllButtonsIn(document.body);

      return () => {
        observer.disconnect();
        document.querySelectorAll("button").forEach((b) => detachListener(b as HTMLButtonElement));
        style.remove();
      };
    });
  }, []);

  if (typeof document === "undefined") return null;

  return ReactDOM.createPortal(
    <>
      {bursts.map((item) => {
        const deltaX = item.endX - item.startX;
        const deltaY = item.endY - item.startY;
        const transform = `translate(${deltaX}px, ${deltaY}px) rotate(${item.rotate}deg) scale(${item.scale})`;

        return (
          <img
            key={item.id}
            src={buttonBurstImage.get()}
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              width: "60px",
              height: "60px",
              pointerEvents: "none",
              zIndex: 9999,
              transform: "translate(0px, 0px)",
              animation: "fly-out 1s ease-out forwards",
              // Pass dynamic end transform via custom property
              ["--transform" as any]: transform,
              translate: `${item.startX}px ${item.startY}px`,
            }}
          />
        );
      })}
    </>,
    document.body
  );
}
