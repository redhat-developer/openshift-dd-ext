import { createDockerDesktopClient } from "@docker/extension-api-client";
import { ExecResult, ExecStreamOptions } from "@docker/extension-api-client-types/dist/v1";
import { KubeContext, UnknownKubeContext } from "../models/KubeContext";
import { OcOptions } from "../models/OcOptions";
import ExecListener from "./execListener";
import { isMacOS, isWindows } from "./PlatformUtils";

const ocPathMac = 'oc' // 'tools/mac/oc';
const ocPathWin = 'oc.exe' //'tools/windows/oc.exe';
const ocPathLinux = 'oc' //tools/linux/oc';

const ocPath = getEmbeddedOcPath();
const ddClient = createDockerDesktopClient();

export const UNSET_VALUE = 'Not set';

export function getEmbeddedOcPath() {
  if (isWindows()) {
    return ocPathWin;
  }
  if (isMacOS()) {
    return ocPathMac;
  }
  return ocPathLinux;
}

export async function deployImage(ocOptions: OcOptions, dockerImage: string, listener?: ExecListener): Promise<void> {
  return new Promise((resolve, reject) => {
    ocStream(
      ocOptions, ["new-app", dockerImage], {
        onOutput(data) {
          if (data.stdout) {
            console.log(data.stdout);
            listener?.onOutput(data.stdout);
          }
          if (data.stderr) {
            console.error(data.stderr);
            listener?.onError(data.stderr);
          }
        },
        onError(error) {
          console.error(error);
          listener?.onError(error);
        },
        onClose(exitCode) {
          console.log("oc new-app ended with exit code " + exitCode);
          if (exitCode === 0) {
            resolve();
          } else {
            reject("Failed to create a new app for " + dockerImage);
          }
        },
        splitOutputLines: true
      }
    );
  });
}

export async function registryLogin(ocOptions: OcOptions, listener?: ExecListener): Promise<string> {
  let err = '';
  let result = '';
  return new Promise((resolve, reject) => {
    ocStream(
      ocOptions, ["registry", "login"], {
        onOutput(data) {
          if (data.stdout) {
            console.log(data.stdout);
            listener?.onOutput(data.stdout);
            result += data.stdout;
          }
          if (data.stderr) {
            console.error(data.stderr);
            listener?.onError(data.stderr);
            err += data.stderr;
          }
        },
        onError(error) {
          console.error(error);
          listener?.onError(error);
        },
        onClose(exitCode) {
          if (exitCode === 0) {
            resolve(result);
          } else {
            reject("Failed to login to openshift container registry: " + err);
          }
        },
        splitOutputLines: true
      }
    );
  });
};

export async function exposeService(ocOptions: OcOptions, appName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    ocExecute(ocOptions, ["expose", "service/" + appName])?.then(result => {
      if (result.stderr) {
        console.log("stderr:" + result.stderr);
        reject(result.stderr);
      }
      console.log("stdout:" + result.stdout);
      resolve(result.stdout);
    }).catch((e) => {
      reject(e);
    });
  });
};

//TODO there must be a better way to get the route
export async function getProjectRoute(ocOptions: OcOptions, appName: string): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    ocExecute(ocOptions, ["describe", "route", appName])?.then(result => {
      if (result.stderr) {
        console.log("stderr:" + result.stderr);
        reject(result.stderr);
      }
      console.log("stdout:" + result.stdout);
      const lines = result.stdout.split('\n');
      const target = lines.find(line => line.startsWith('Requested Host:'));
      var route = undefined;
      if (target) {
        route = 'http://' + target.substring('Requested Host:'.length).trim();
      }
      resolve(route);
    }).catch((e) => {
      reject(e);
    });
  });
};

export function getAppName(imageName: string) {
  const segments = imageName.split(':')[0].split('/');
  //return last segment
  return segments[segments.length - 1];
}

function loadUserName(userItem: any) {
  const segments = userItem?.name?.split('/');
  if (segments?.length && segments.length > 1) {
    return segments[0];
  }
  return segments ? segments : UNSET_VALUE;
}

export function loadContextUiData(kubeConfig: any, contextName: string): KubeContext {
  const context = kubeConfig.contexts.find((c: any) => c.name === contextName);
  const project = context.context.namespace ? context.context.namespace : UNSET_VALUE;
  //Getting the username will be tricky since this happens:
  // oc get user
  // Error from server (Forbidden): users.user.openshift.io is forbidden: User "100210525024987209584" cannot list users.user.openshift.io at the cluster scope: no RBAC policy matched
  // another option is oc whoami
  const userItem = kubeConfig.users.find((u: any) => u.name === context.context.user);
  const user = loadUserName(userItem);
  const clusters = kubeConfig.clusters;
  if (clusters) {
    const cluster = clusters.find((c: { name?: string, cluster: any }) => c.name === context.context.cluster)?.cluster;
    if (cluster) {
      return {
        project: project,
        name: contextName,
        clusterUrl: cluster.server,
        user
      };
    }
  }
  return UnknownKubeContext;

}

export async function loadKubeContext(ocOptions: OcOptions): Promise<KubeContext> {
  const kubeConfig = await readKubeConfig(ocOptions);
  if (kubeConfig) {
    const currentContext = kubeConfig["current-context"];
    if (currentContext) {
      return loadContextUiData(kubeConfig, currentContext);
    }
  }
  return UnknownKubeContext;
}

export async function readKubeConfig(ocOptions: OcOptions): Promise<any> {
  return new Promise((resolve, reject) => {
    ocExecute(ocOptions, ["config", "view", "-o", "json"])?.then(result => {
      if (result.stderr) {
        console.log("stderr:" + result.stderr);
        reject(result.stderr);
      }
      const config = JSON.parse(result.stdout);
      console.log(`kube config:\n ${JSON.stringify(config)}`);
      resolve(config);
    }).catch((e) => {
      handleError(reject, e);
    });
  });
}

export async function loadProjectNames(ocOptions: OcOptions): Promise<string[]> {
  return new Promise((resolve, reject) => {
    ocExecute(ocOptions, ["get", "projects", "-o", "json"])?.then(result => {
      if (result.stderr) {
        console.log("stderr:" + result.stderr);
        reject(result.stderr);
      }
      const projects = JSON.parse(result.stdout);
      console.log(`projects/namespaces:\n ${JSON.stringify(projects.items)}`);
      resolve(projects.items.map((project: any) => project.metadata.name));
    }).catch((e) => {
      handleError(reject, e);
    });
  });
}

export async function loadServerUrls(ocOptions: OcOptions, kcp: any = undefined): Promise<string[]> {
  const kc = kcp ? kcp : await readKubeConfig(ocOptions);
  const clusters: string[] = kc.clusters.map((item: any) => item.cluster.server);
  return [... new Set(clusters)];
}

export async function setCurrentContextProject(ocOptions: OcOptions, projectName: string) {
  return new Promise((resolve, reject) => {
    ocExecute(ocOptions, ["project", projectName])?.then(result => {
      if (result.stderr) {
        console.log("stderr:" + result.stderr);
        reject(result.stderr);
      }
      console.log(`current project set to ${projectName}`);
      resolve(projectName);
    }).catch((e) => {
      handleError(reject, e);
    });
  });
}

export async function isOpenshift(ocOptions: OcOptions) {
  return new Promise((resolve, reject) => {
    ocExecute(ocOptions, ["api-versions"])?.then(result => {
      if (result.stderr) {
        console.log("stderr:" + result.stderr);
        reject(result.stderr);
      }
      const apiFound = result.stdout.includes("apps.openshift.io/v1");
      console.log(`The cluster is${apiFound ? " " : " not "}OpenShift`);
      resolve(apiFound);
    }).catch((e) => {
      handleError(reject, e);
    });
  });
}

export async function setCurrentContext(ocOptions: OcOptions, contextName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ocExecute(ocOptions, ["config", "use-context", contextName])?.then(result => {
      if (result.stderr) {
        console.log("stderr:" + result.stderr);
        reject(result.stderr);
      }
      console.log(`The current-context set to ${contextName}.`);
      resolve();
    }).catch((e) => {
      handleError(reject, e);
    });
  });
}

export async function login(ocOptions: OcOptions, cluster: string, username: string, password: string, skipTlsVerify: boolean = false): Promise<void> {
  return new Promise((resolve, reject) => {
    ocExecute(ocOptions, ["login", cluster, '-u', username, '-p', password])?.then(result => {
      if (result.stderr) {
        console.log("stderr:" + result.stderr);
        reject(result.stderr);
      }
      console.log(`logged into cluster ${cluster}  with username ${username}.`);
      resolve();
    }).catch((e) => {
      handleError(reject, e);
    });
  });
}

export async function loginWithToken(ocOptions: OcOptions, cluster: string, token: string, skipTlsVerify: boolean = false): Promise<void> {
  return new Promise((resolve, reject) => {
    ocExecute(ocOptions, ["login", cluster, '--token', token])?.then(result => {
      if (result.stderr) {
        console.log("stderr:" + result.stderr);
        reject(result.stderr);
      }
      console.log(`logged into cluster ${cluster}  with token ${token}.`);
      resolve();
    }).catch((e) => {
      handleError(reject, e);
    });
  });
}

export async function createProject(ocOptions: OcOptions, name: string): Promise<void> {
  return ocExecute(ocOptions, ['new-project', name])?.then((result) => {
    if (result.stderr) {
      console.error('stderr:', result.stderr);
      throw new Error(result.stderr);
    }
    console.info(`Created project '${name}'.`)
  })
}

export async function createImageStream(ocOptions: OcOptions, name: string): Promise<void> {
  return ocExecute(ocOptions, ['create', 'imagestream', name])?.then((result) => {
    if (result.stderr) {
      console.error('stderr:', result.stderr);
      throw new Error(result.stderr);
    }
    console.info(`Created imagestream '${name}'.`)
  })
}

export async function listProjects(ocOptions: OcOptions): Promise<string[]> {
  const result = ocExecute(
    ocOptions,
    ['get', 'projects', '-o', 'jsonpath="{range .items[*]}{.metadata.name}{\' \'}{range}"']
  )?.then((result) => {
    let projects: string[] = [];
    if (result.stderr) {
      console.error('stderr:', result.stderr);
    } else {
      console.info(`Available projects '${result.stdout}'.`);
      projects = result.stdout.trim().split(' ');
    }
    return projects;
  });
  return result ? result : []; // check for null required because of optional chaining
}

export async function getOpenShiftConsoleURL(ocOptions: OcOptions, context: KubeContext): Promise<string | undefined> {

  if (!context.clusterUrl) {
    return undefined;
  }

  return new Promise((resolve, reject) => {
    //TODO: see if getting the console url from any context is doable
    ocExecute(
      ocOptions,
      ['get', 'configmaps', 'console-public', '-n', 'openshift-config-managed', '-o', 'jsonpath="{.data.consoleURL}"']
    )?.then((result) => {
      let consoleURL: string | undefined;
      if (result.stderr) {
        console.error('stderr:', result.stderr);
        reject(result.stderr);
      } else {
        consoleURL = result.stdout.trim();
      }
      resolve(consoleURL);
    }).catch((e) => {
      handleError(reject, e);
    });
  });
}

export async function getOpenShiftRegistryURL(ocOptions: OcOptions, context: KubeContext): Promise<string | undefined> {
  if (!context.clusterUrl) {
    return undefined;
  }
  return new Promise((resolve, reject) => {
    ocExecute(ocOptions, ['registry', 'info'])?.then((result) => {
      let registryURL: string | undefined;
      if (result.stderr) {
        console.error('stderr:', result.stderr);
        reject(result.stderr);
      } else {
        registryURL = result.stdout.trim();
      }
      resolve(registryURL);
    }).catch((e) => {
      handleError(reject, e);
    });
  });
}

function ocExecute(ocOptions: OcOptions, args: string[]): Promise<ExecResult> | undefined {
  if (ocOptions.skipTlsVerify) {
    args = [...args, '--insecure-skip-tls-verify'];
  }
  return ddClient.extension?.host?.cli?.exec(ocPath, args);
}

function ocStream(ocOptions: OcOptions, args: string[], stream: ExecStreamOptions): void {
  if (ocOptions.skipTlsVerify) {
    args = [...args, '--insecure-skip-tls-verify'];
  }
  ddClient.extension?.host?.cli?.exec(ocPath, args, {
    stream,
  });
}

function handleError(reject: (reason?: any) => void, e: any) {
  if (e.stderr) {
    reject(e.stderr);
  } else if (e.stdout) {
    reject(e.stdout);
  } else {
    reject(e);
  }
}
