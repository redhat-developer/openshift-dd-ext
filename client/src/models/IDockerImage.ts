export type IDockerImage = {
  RepoTags?: string[]
  ExposedPorts?: Map<string, any[]>
};


export interface ISelectedImage {
  name: string;
  image: IDockerImage;
}