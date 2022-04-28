import { createDockerDesktopClient } from "@docker/extension-api-client";
import { IDockerImage, IDockerImageInspectOutput } from "../models/IDockerImage";



const ddClient = createDockerDesktopClient();
/**
 * @returns Returns a promise that resolves to a map of local docker images.
 */
export async function getLocalImages(): Promise<Map<string, IDockerImage>> {
  const images = (await ddClient.docker.listImages()) as IDockerImage[];
  const imageMap = new Map<string, IDockerImage>();
  for (const image of images) {
    if (image.Labels && image.Labels["com.docker.desktop.extension.api.version"]) {
      //Ignore Docker Desktop extension images
        continue;
    }
    const tags = image.RepoTags?.filter(tag => tag != null && '<none>:<none>' !== tag)
    if (tags && tags.length > 0) {
      for (const imageName of tags) {
        imageMap.set(imageName, image);
      }
    }
  }
  return imageMap;
}

export async function getLocalImageInspectionJson(tag: string): Promise<IDockerImageInspectOutput[] | undefined> {

  try {
    const result = await ddClient.docker.cli.exec('image', ['inspect', tag]);
    const resultJson = JSON.parse(result.stdout)
    return resultJson as IDockerImageInspectOutput[];
  } catch (err) {
    console.log(err);
  }
  return;
}