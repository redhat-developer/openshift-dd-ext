import { createDockerDesktopClient } from "@docker/extension-api-client";
import { KubeContext, UnknownKubeContext } from "../models/KubeContext";
import { isMacOS, isWindows } from "./PlatformUtils";

const ocPathMac = 'oc' // 'tools/mac/oc';
const ocPathWin = 'oc.exe' //'tools/windows/oc.exe';
const ocPathLinux = 'oc' //tools/linux/oc';

const ocPath = getEmbeddedOcPath();
const ddClient = createDockerDesktopClient();

export function getEmbeddedOcPath() {
  if (isWindows()) {
    return ocPathWin;
  }
  if (isMacOS()) {
    return ocPathMac;
  }
  return ocPathLinux;
}

export async function deployImage(dockerImage: string): Promise<string> {
  return new Promise((resolve, reject) => {
    ddClient.extension?.host?.cli.exec(ocPath, ["new-app", "--image", dockerImage]).then(result => {
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

export async function exposeService(appName: string) {
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
    ddClient.extension?.host?.cli.exec(ocPath, ["describe", "route"]).then(result => {
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

export async function loadKubeContext(): Promise<KubeContext> {
  const kubeConfig = await readKubeConfig();
  if (kubeConfig) {
    const currentContext = kubeConfig["current-context"];
    if (currentContext) {
      const context = kubeConfig.contexts.find((c: any) => c.name === currentContext);
      const project = context.context.namespace ? context.context.namespace : 'not set';
      const contextName = currentContext;
      //Getting the username will be tricky since this happens:
      // oc get user
      // Error from server (Forbidden): users.user.openshift.io is forbidden: User "100210525024987209584" cannot list users.user.openshift.io at the cluster scope: no RBAC policy matched
      // another option is oc whoami
      const userItem = kubeConfig.users.find((u: any) => u.name === context.context.user);
      const clusters = kubeConfig.clusters;
      if (clusters) {
        const cluster = clusters.find((c: { name?: string, cluster: any }) => c.name === context.context.cluster)?.cluster;
        return {
          project: project,
          name: contextName,
          clusterUrl: cluster.server,
          user: userItem.name
        };
      }
    };
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
      reject(e);
    });
  });
}

export async function loadProjectNames(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    ddClient.extension?.host?.cli.exec(ocPath, ["get", "namespaces", "-o", "json"]).then(result => {
      if (result.stderr) {
        console.log("stderr:" + result.stderr);
        reject(result.stderr);
      }
      const projects = JSON.parse(result.stdout);
      console.log(`projects/namespaces:\n ${JSON.stringify(projects.items)}`);
      resolve(projects.items.map((project: any) => project.metadata.name));
    }).catch((e) => {
      reject(e);
    });
  });
}

export async function setCurrentContextProject(projectName: string) {
  return new Promise((resolve, reject) => {
    ddClient.extension?.host?.cli.exec(ocPath, ["project", projectName]).then(result => {
      if (result.stderr) {
        console.log("stderr:" + result.stderr);
        reject(result.stderr);
      }
      const projects = JSON.parse(result.stdout);
      console.log(`current project set to ${projectName}`);
      resolve(projectName);
    }).catch((e) => {
      reject(e);
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
      reject(e);
    });
  });
}

export async function setContext(contextName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ddClient.extension?.host?.cli.exec(ocPath, ["config", "set-context", contextName]).then(result => {
      if (result.stderr) {
        console.log("stderr:" + result.stderr);
        reject(result.stderr);
      }
      console.log(`The current-context set to ${contextName}.`);
      resolve();
    }).catch((e) => {
      reject(e);
    });
  });
}
