import { createDockerDesktopClient } from "@docker/extension-api-client";
import { KubeContext, UnknownKubeContext } from "../models/KubeContext";
import { getMessage } from "./ErrorUtils";
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

export async function deployImage(dockerImage: string, listener?: ExecListener): Promise<void> {
  return new Promise((resolve, reject) => {
    ddClient.extension?.host?.cli.exec(
      ocPath, ["new-app", dockerImage], {
      stream: {
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
    }
    );
  });
}

export async function registryLogin(listener?: ExecListener): Promise<string> {
  let err = '';
  let result = '';
  return new Promise((resolve, reject) => {
    ddClient.extension?.host?.cli.exec(
      ocPath, ["registry", "login"], {
        stream: {
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
      }
    );
  });
};

export async function exposeService(appName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    ddClient.extension?.host?.cli.exec(ocPath, ["expose", "service/" + appName]).then(result => {
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
export async function getProjectRoute(appName: string): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    ddClient.extension?.host?.cli.exec(ocPath, ["describe", "route", appName]).then(result => {
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

export async function isLoggedIn(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    ddClient.extension?.host?.cli.exec(ocPath, ["whoami"]).then(result => {
      if (result.stderr) {
        console.log("stderr:" + result.stderr);
        resolve(false);
      } else {
        console.log("stdout:" + result.stdout);
        resolve(true);
      }
    }).catch((e) => {
      if (getMessage(e).toLowerCase().includes('(unauthorized)')) {
        resolve(false);
      } else {
        reject(e);
      }
    });
  });
}

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

export async function loadKubeContext(): Promise<KubeContext> {
  const kubeConfig = await readKubeConfig();
  if (kubeConfig) {
    const currentContext = kubeConfig["current-context"];
    if (currentContext) {
      return loadContextUiData(kubeConfig, currentContext);
    }
  }
  return UnknownKubeContext;
}

export async function readKubeConfig(): Promise<any> {
  return new Promise((resolve, reject) => {
    ddClient.extension?.host?.cli.exec(ocPath, ["config", "view", "-o", "json"]).then(result => {
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

export async function loadProjectNames(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    ddClient.extension?.host?.cli.exec(ocPath, ["get", "projects", "-o", "json"]).then(result => {
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

export async function loadServerUrls(kcp: any = undefined): Promise<string[]> {
  const kc = kcp ? kcp : await readKubeConfig();
  const clusters: string[] = kc.clusters.map((item: any) => item.cluster.server);
  return [... new Set(clusters)];
}

export async function setCurrentContextProject(projectName: string) {
  return new Promise((resolve, reject) => {
    ddClient.extension?.host?.cli.exec(ocPath, ["project", projectName]).then(result => {
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

export async function isOpenshift() {
  return new Promise((resolve, reject) => {
    ddClient.extension?.host?.cli.exec(ocPath, ["api-versions"]).then(result => {
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

export async function setCurrentContext(contextName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ddClient.extension?.host?.cli.exec(ocPath, ["config", "use-context", contextName]).then(result => {
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

export async function login(cluster: string, username: string, password: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ddClient.extension?.host?.cli.exec(ocPath, ["login", cluster, '-u', username, '-p', password]).then(result => {
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

export async function loginWithToken(cluster: string, token: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ddClient.extension?.host?.cli.exec(ocPath, ["login", cluster, '--token', token]).then(result => {
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

export async function createProject(name: string): Promise<void> {
  return ddClient.extension?.host?.cli.exec(ocPath, ['new-project', name]).then((result) => {
    if (result.stderr) {
      console.error('stderr:', result.stderr);
      throw new Error(result.stderr);
    }
    console.info(`Created project '${name}'.`)
  })
}

export async function createImageStream(name: string): Promise<void> {
  return ddClient.extension?.host?.cli.exec(ocPath, ['create', 'imagestream', name]).then((result) => {
    if (result.stderr) {
      console.error('stderr:', result.stderr);
      throw new Error(result.stderr);
    }
    console.info(`Created imagestream '${name}'.`)
  })
}

export async function listProjects(): Promise<string[]> {
  const result = ddClient.extension?.host?.cli.exec(
    ocPath,
    ['get', 'projects', '-o', 'jsonpath="{range .items[*]}{.metadata.name}{\' \'}{range}"']
  ).then((result) => {
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

export async function getOpenShiftConsoleURL(context: KubeContext): Promise<string | undefined> {

  if (!context.clusterUrl) {
    return undefined;
  }

  return new Promise((resolve, reject) => {
    //TODO: see if getting the console url from any context is doable
    ddClient.extension?.host?.cli.exec(
      ocPath,
      ['get', 'configmaps', 'console-public', '-n', 'openshift-config-managed', '-o', 'jsonpath="{.data.consoleURL}"']
    ).then((result) => {
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

export async function getOpenShiftRegistryURL(context: KubeContext): Promise<string | undefined> {
  if (!context.clusterUrl) {
    return undefined;
  }
  return new Promise((resolve, reject) => {
    ddClient.extension?.host?.cli.exec(ocPath, ['registry', 'info']).then((result) => {
      let registryURL: string | undefined;
      if (result.stderr) {
        console.error('stderr:', result.stderr);
        reject(result.stderr);
      } else {
        registryURL = result.stdout.trim();
        // TODO 'oc registry info' might return 'docker-registry.default.svc:5000' 
        // for some remote clusters. Removing it for now
        if (registryURL.includes('docker-registry.default.svc') && 
            !context.clusterUrl!.includes('kubernetes.docker.internal')) {
          registryURL = undefined;
        }
      }
      resolve(registryURL);
    }).catch((e) => {
      handleError(reject, e);
    });
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
