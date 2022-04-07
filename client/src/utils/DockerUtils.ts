import { createDockerDesktopClient } from "@docker/extension-api-client";
import { IDockerImage } from "../models/IDockerImage";



const ddClient = createDockerDesktopClient();
/**
 * @returns Returns a promise that resolves to a map of local docker images.
 */
export async function getLocalImages(): Promise<Map<string, IDockerImage>> {
  const images = (await ddClient.docker.listImages()) as IDockerImage[];
  const imageMap = new Map<string, IDockerImage>();
  for (const image of images) {
    const tags = image.RepoTags?.filter(tag => tag != null && '<none>:<none>' !== tag);
    if (tags && tags.length > 0) {
      const imageName = tags[0];
      imageMap.set(imageName, image);
    }
  }
  return imageMap;
}