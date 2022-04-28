export type IDockerImage = {
  RepoTags?: string[]
  Labels?: { [k: string]: string }
  ExposedPorts?: Map<string, any[]>
};

export interface IDockerImageInspectOutput {
  Config: {
    ExposedPorts: any;
  }
}


export interface ISelectedImage {
  name: string;
  image: IDockerImage;
}