import { createDockerDesktopClient } from "@docker/extension-api-client";

const ddClient = createDockerDesktopClient();
/**
 * @returns Returns a promise that resolves to a list of local docker images, sorted by name.
 */
export async function getLocalImages(): Promise<string[]> {
  const data = (await ddClient.docker.listImages()) as any;
  const images = data.map((i: { RepoTags: string[] | null }) => i.RepoTags)
    .flat()
    .filter((i: string | null) => i != null && '<none>:<none>' !== i).flat().sort();
  return images as string[];
}