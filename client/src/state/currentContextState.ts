import { atom, selector } from "recoil";
import { KubeContextLinks, UnknownKubeContext } from "../models/KubeContext";
import { getMessage } from "../utils/ErrorUtils";
import { getOpenShiftConsoleURL } from "../utils/OcUtils";

export const currentContextState = atom({
  key: 'contextState',
  default: UnknownKubeContext,
});

const LINKS = new Map<string, KubeContextLinks>();
const oauthMetadataEndpoint = '.well-known/oauth-authorization-server';

export const currentContextLinksState = selector({
  key: 'contextLinksState',
  get:  async ({get}) => {
    const context = get(currentContextState);
    if (context === UnknownKubeContext || !context.clusterUrl) {
      return undefined;
    }
    if (LINKS.has(context.clusterUrl)) {
      return LINKS.get(context.clusterUrl);
    }

    let tokenUrl: string | undefined;
    try {
      const response = await fetch(`${context.clusterUrl}/${oauthMetadataEndpoint}`);
      if (response.ok) {
        const json = await response.json();
        tokenUrl = json.token_endpoint;
      }
    } catch (e) {
      console.error(`Error finding token url for ${context.clusterUrl}: ${getMessage(e)}`);
    }

    let consoleUrl: string | undefined;
    try {
      consoleUrl = await getOpenShiftConsoleURL(context);
      console.info(`Console url for ${context.clusterUrl}: ${consoleUrl}`);
    } catch (e) {
      console.error(`Error finding console url for ${context.clusterUrl}: ${getMessage(e)}`);
    }
    
    const links: KubeContextLinks = {
      dashboardUrl: consoleUrl,
      tokenUrl: tokenUrl?`${tokenUrl}/request`:undefined,
    };

    LINKS.set(context.clusterUrl, links);

    return links;
  }
});