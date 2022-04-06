import { createDockerDesktopClient } from "@docker/extension-api-client";
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
