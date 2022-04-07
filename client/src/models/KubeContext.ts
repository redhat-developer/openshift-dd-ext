export interface KubeContext {
  name: string | undefined;
  project: string | undefined;
  clusterUrl: string | undefined;
  user: string | undefined;
}

export const UnknownKubeContext: KubeContext = {
  name: undefined,
  project: undefined,
  clusterUrl: undefined,
  user: undefined
}