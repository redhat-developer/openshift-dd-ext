export interface KubeContext {
  name?: string;
  project?: string;
  clusterUrl?: string;
  user?: string;
}

export interface KubeContextLinks {
  dashboardUrl?: string;
  tokenUrl?: string;
}

export const UnknownKubeContext: KubeContext = {
  name: undefined,
  project: undefined,
  clusterUrl: undefined,
  user: undefined
}