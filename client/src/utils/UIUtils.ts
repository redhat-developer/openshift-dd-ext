import { createDockerDesktopClient } from "@docker/extension-api-client";
const ddClient = createDockerDesktopClient();
export const toast = ddClient.desktopUI.toast;

export function openInBrowser(url: string): void {
  ddClient.host.openExternal(url);
}