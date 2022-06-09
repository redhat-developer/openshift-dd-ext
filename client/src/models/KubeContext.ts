export interface KubeContext {
  name?: string;
  project?: string;
  clusterUrl?: string;
  user?: string;
}

export const UnknownKubeContext: KubeContext = {
  name: undefined,
  project: undefined,
  clusterUrl: undefined,
  user: undefined
}