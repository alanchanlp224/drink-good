/** Floating trigger icon — matches Testing project sommelier-trigger. */

import type { FloatingTriggerOptions } from "../core/adapter";
import type { PageProcessor } from "./processor";

const TRIGGER_ID = "drink-good-trigger";
const STACK_WATCH_ATTR = "data-dg-stack-wired";
const DEFAULT_BOTTOM_PX = 24;
const DEFAULT_RIGHT_PX = 24;
const DEFAULT_STACK_GAP_PX = 16;
/** Reserve space before Smile/rewards widgets load (pill ~60px + gap). */
const STACK_FALLBACK_BOTTOM_PX = 96;
const MIN_OBSTACLE_HEIGHT_PX = 10;
const STACK_POLL_MS = 250;
const STACK_POLL_MAX_MS = 15_000;

/** FAB `bottom` CSS so its bottom edge sits `gapPx` above an obstacle's top. */
export function computeStackedTriggerBottom(
  viewportHeight: number,
  obstacleTop: number,
  gapPx: number,
): number {
  return Math.ceil(viewportHeight - obstacleTop + gapPx);
}

export function mountFloatingButton(
  processor: PageProcessor,
  triggerOptions?: FloatingTriggerOptions,
): HTMLElement {
  const existing = document.getElementById(TRIGGER_ID);
  if (existing) {
    if (
      triggerOptions?.stackAboveSelector &&
      existing.getAttribute(STACK_WATCH_ATTR) !== "1"
    ) {
      watchStackedTriggerPosition(existing, triggerOptions);
    }
    return existing;
  }

  const usesStacking = Boolean(triggerOptions?.stackAboveSelector);
  const bottomPx = usesStacking
    ? (triggerOptions?.bottomPx ?? STACK_FALLBACK_BOTTOM_PX)
    : (triggerOptions?.bottomPx ?? DEFAULT_BOTTOM_PX);
  const rightPx = triggerOptions?.rightPx ?? DEFAULT_RIGHT_PX;

  const wrapper = document.createElement("div");
  wrapper.id = TRIGGER_ID;
  wrapper.setAttribute("role", "button");
  wrapper.setAttribute("tabindex", "0");
  wrapper.setAttribute("aria-label", "Start Drink Good Vivino lookup");
  wrapper.innerHTML = `
    <style>
      #${TRIGGER_ID} {
        position: fixed;
        bottom: ${bottomPx}px;
        right: ${rightPx}px;
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
  if (triggerOptions?.stackAboveSelector) {
    watchStackedTriggerPosition(wrapper, triggerOptions);
  }
  processor.onStateChange(() => {
    syncTriggerState(wrapper, processor.isRunning());
  });
  syncTriggerState(wrapper, processor.isRunning());
  return wrapper;
}

function applyStackedTriggerPosition(
  wrapper: HTMLElement,
  options: FloatingTriggerOptions,
): boolean {
  const selector = options.stackAboveSelector;
  if (!selector) {
    return false;
  }

  const rightPx = options.rightPx ?? DEFAULT_RIGHT_PX;
  const gapPx = options.stackGapPx ?? DEFAULT_STACK_GAP_PX;
  const obstacle = document.querySelector(selector);
  const rect = obstacle?.getBoundingClientRect();

  if (!rect || rect.height < MIN_OBSTACLE_HEIGHT_PX) {
    wrapper.style.bottom = `${
      options.bottomPx ??
      (options.stackAboveSelector
        ? STACK_FALLBACK_BOTTOM_PX
        : DEFAULT_BOTTOM_PX)
    }px`;
    wrapper.style.right = `${rightPx}px`;
    return false;
  }

  wrapper.style.bottom = `${computeStackedTriggerBottom(window.innerHeight, rect.top, gapPx)}px`;
  wrapper.style.right = `${rightPx}px`;
  return true;
}

function watchStackedTriggerPosition(
  wrapper: HTMLElement,
  options: FloatingTriggerOptions,
): void {
  if (wrapper.getAttribute(STACK_WATCH_ATTR) === "1") {
    return;
  }
  wrapper.setAttribute(STACK_WATCH_ATTR, "1");

  let resizeObserver: ResizeObserver | undefined;
  let observedObstacle: Element | null = null;

  const apply = (): boolean => {
    const positioned = applyStackedTriggerPosition(wrapper, options);
    const selector = options.stackAboveSelector;
    if (!selector) {
      return positioned;
    }

    const obstacle = document.querySelector(selector);
    if (obstacle && obstacle !== observedObstacle) {
      resizeObserver?.disconnect();
      observedObstacle = obstacle;
      resizeObserver = new ResizeObserver(() => {
        applyStackedTriggerPosition(wrapper, options);
      });
      resizeObserver.observe(obstacle);
    }
    return positioned;
  };

  apply();
  window.addEventListener("resize", apply);

  const observer = new MutationObserver(() => {
    apply();
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "style"],
  });

  const pollStartedAt = Date.now();
  const poll = window.setInterval(() => {
    if (apply() || Date.now() - pollStartedAt >= STACK_POLL_MAX_MS) {
      window.clearInterval(poll);
    }
  }, STACK_POLL_MS);
}

function syncTriggerState(wrapper: HTMLElement, running: boolean): void {
  wrapper.classList.toggle("drink-good-running", running);
  wrapper.setAttribute(
    "aria-label",
    running ? "Stop Drink Good lookup" : "Start Drink Good Vivino lookup",
  );
}
