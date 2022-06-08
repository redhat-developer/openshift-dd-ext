import { atom, selector } from "recoil";
import { UnknownKubeContext } from "../models/KubeContext";
import { getMessage } from "../utils/ErrorUtils";
import { getOpenShiftConsoleURL } from "../utils/OcUtils";

export const currentContextState = atom({
  key: 'contextState',
  default: UnknownKubeContext
});

const CONSOLE_URLS = new Map<string, string>();
const NO_CONSOLE = 'no-console';

export const currentDashboardState = selector({
  key: 'dashboardState',
  get:  async ({get}) => {
    const context = get(currentContextState);
    if (context === UnknownKubeContext || !context.clusterUrl) {
      return undefined;
    }
    let consoleUrl:string|undefined;

    if (CONSOLE_URLS.has(context.clusterUrl)) {
      const url = CONSOLE_URLS.get(context.clusterUrl);
      return (NO_CONSOLE === url) ? undefined : url;
    }
    try {
      consoleUrl = await getOpenShiftConsoleURL(context);
      console.info(`Console url for ${context.clusterUrl}: ${consoleUrl}`);
    } catch (e) {
      console.error(`Error finding console url for ${context.clusterUrl}: ${getMessage(e)}`);
    }
    CONSOLE_URLS.set(context.clusterUrl, (consoleUrl ? consoleUrl : NO_CONSOLE));
    return consoleUrl;
  }
});