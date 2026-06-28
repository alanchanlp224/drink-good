/** Send typed messages to the service worker. */

import type { BackgroundRequest, BackgroundResponse } from "./messages";
import { isBackgroundResponse } from "./messages";

export async function sendBackgroundRequest(
  request: BackgroundRequest,
): Promise<BackgroundResponse> {
  const response: unknown = await chrome.runtime.sendMessage(request);
  if (!isBackgroundResponse(response)) {
    throw new Error("Invalid response from service worker");
  }
  if (response.type === "ERROR") {
    throw new Error(response.message);
  }
  return response;
}
