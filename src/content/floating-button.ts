/** Floating trigger icon — matches Testing project sommelier-trigger. */

import type { PageProcessor } from "./processor";

const TRIGGER_ID = "drink-good-trigger";

export function mountFloatingButton(processor: PageProcessor): HTMLElement {
  const existing = document.getElementById(TRIGGER_ID);
  if (existing) {
    return existing;
  }

  const wrapper = document.createElement("div");
  wrapper.id = TRIGGER_ID;
  wrapper.setAttribute("role", "button");
  wrapper.setAttribute("tabindex", "0");
  wrapper.setAttribute("aria-label", "Start Drink Good Vivino lookup");
  wrapper.innerHTML = `
    <style>
      #${TRIGGER_ID} {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, #722f37 0%, #4a1c22 100%);
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2147483646;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      #${TRIGGER_ID}:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 16px rgba(0,0,0,0.4);
      }
      #${TRIGGER_ID}:focus-visible {
        outline: 2px solid #fbbf24;
        outline-offset: 3px;
      }
      #${TRIGGER_ID}.drink-good-running {
        animation: drink-good-flash 1s ease-in-out infinite;
      }
      @keyframes drink-good-flash {
        0%, 100% { opacity: 1; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
        50% { opacity: 0.7; box-shadow: 0 0 20px rgba(114,47,55,0.6); }
      }
      @media (prefers-reduced-motion: reduce) {
        #${TRIGGER_ID}.drink-good-running {
          animation: none;
        }
      }
      #${TRIGGER_ID} svg {
        width: 28px;
        height: 28px;
        fill: white;
      }
    </style>
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M6 3v6c0 2.97 2.16 5.43 5 5.91V19H8v2h8v-2h-3v-4.09c2.84-.48 5-2.94 5-5.91V3H6zm10 5H8V5h8v3z"/>
    </svg>
  `;

  const activate = (): void => {
    void processor.toggle().then(() => {
      syncTriggerState(wrapper, processor.isRunning());
    });
  };

  wrapper.addEventListener("click", activate);
  wrapper.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activate();
    }
  });

  document.body.appendChild(wrapper);
  syncTriggerState(wrapper, processor.isRunning());
  return wrapper;
}

function syncTriggerState(wrapper: HTMLElement, running: boolean): void {
  wrapper.classList.toggle("drink-good-running", running);
  wrapper.setAttribute(
    "aria-label",
    running ? "Stop Drink Good lookup" : "Start Drink Good Vivino lookup",
  );
}
