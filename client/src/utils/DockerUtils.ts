import { createDockerDesktopClient } from "@docker/extension-api-client";
import { IDockerImage, IDockerImageInspectOutput } from "../models/IDockerImage";

export interface ConsoleListener {
    onOutput(line: string): void;
    onError(line: string): void;
}

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

// Push the image to docker hub
export async function pushImage(imageName: string, listener?: ConsoleListener): Promise<void> {
  return new Promise((resolve, reject) => {
    ddClient.docker.cli.exec('image', ['push', imageName], {
        stream: {
          onOutput(data) {
            if (listener) {
              if (data.stdout) {
                console.log(data.stdout);
                listener.onOutput(data.stdout);
              } 
              if (data.stderr) {
                console.error(data.stderr);
                listener.onError(data.stderr);
              }
            }
          },
          onError(error) {
            console.error(error);
            if (listener) {
              listener.onError(error);
            }
          },
          onClose(exitCode) {
            console.log("docker push ended with exit code " + exitCode);
            if (exitCode === 0) {
              resolve();
            } else {
              reject(exitCode);
            }
          },
          splitOutputLines: true
      }
    });
  });
  
}