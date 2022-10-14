import { atom, selector } from "recoil";
import { UnknownKubeContext } from "../models/KubeContext";
import { getMessage } from "../utils/ErrorUtils";
import { getOpenShiftConsoleURL, getOpenShiftRegistryURL } from "../utils/OcUtils";
import { currentOcOptions } from "./currentOcOptionsState";

export const currentContextState = atom({
  key: 'contextState',
  default: UnknownKubeContext,
});

const CONSOLE_URLS = new Map<string, string>();
const NO_CONSOLE = 'no-console';

const REGISTRY_URLS = new Map<string, string>();
const NO_REGISTRY = 'no-registry';

export const currentDashboardState = selector({
  key: 'dashboardState',
  get:  async ({get}) => {
    const ocOptions = get(currentOcOptions);
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
      consoleUrl = await getOpenShiftConsoleURL(ocOptions, context);
      console.info(`Console url for ${context.clusterUrl}: ${consoleUrl}`);
    } catch (e) {
      console.error(`Error finding console url for ${context.clusterUrl}: ${getMessage(e)}`);
    }
    CONSOLE_URLS.set(context.clusterUrl, (consoleUrl ? consoleUrl : NO_CONSOLE));
    return consoleUrl;
  }
});

export const currentOpenShiftRegistryState = selector({
  key: 'openShiftRegistryState',
  get:  async ({get}) => {
    const ocOptions = get(currentOcOptions);
    const context = get(currentContextState);
    if (context === UnknownKubeContext || !context.clusterUrl) {
      return undefined;
    }
    let registryUrl:string|undefined;

    if (REGISTRY_URLS.has(context.clusterUrl)) {
      const url = REGISTRY_URLS.get(context.clusterUrl);
      return (NO_REGISTRY === url) ? undefined : url;
    }
    try {
      registryUrl = await getOpenShiftRegistryURL(ocOptions, context);
      console.info(`Container registry url for ${context.clusterUrl}: ${registryUrl}`);
    } catch (e) {
      console.error(`Error finding container registry url for ${context.clusterUrl}: ${getMessage(e)}`);
    }
    CONSOLE_URLS.set(context.clusterUrl, (registryUrl ? registryUrl : NO_CONSOLE));
    return registryUrl;
  }
});