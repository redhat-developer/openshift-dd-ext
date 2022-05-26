import { Box } from '@mui/material';
import { useState } from 'react';
import CurrentContext from './ContextCard';
import DeploymentOutput from './DeploymentOutput';
import Header from './Header';
import Welcome from './Welcome';
import Logo from './logo';
import ImageSelector from './imageSelector';
import { ISelectedImage } from './models/IDockerImage';
import { deployImage, exposeService, getAppName, getProjectRoute } from './utils/OcUtils';
import { openInBrowser, toast } from './utils/UIUtils';
import { getLocalImageInspectionJson } from './utils/DockerUtils';
import { useLocalState } from './hooks/useStorageState';
import { waitOnUrl } from './utils/waitOnUrl';

const WAITING_ON_URL_TIMEOUT = 20000;

export function App() {
  const [deployResponse, setDeployResponse] = useState("");

  async function deploy(selectedImage: ISelectedImage) {
    const imageName = selectedImage.name;
    let output = `Deploying ${imageName}...`
    setDeployResponse(output);
    try {
      output = await deployImage(imageName);
      setDeployResponse(output);
    } catch (err) {
      toast.error(`Failed to deploy ${imageName}`);
      const e = err as any;
      output = output + '\n' + (e.stderr ? e.stderr : e);
      setDeployResponse(output);
      return;
    }
    const inspectionData = await getLocalImageInspectionJson(selectedImage.name);
    let exposedPorts = inspectionData?.[0].Config.ExposedPorts;

    const hasExposedPorts = exposedPorts && Object.keys(exposedPorts).length > 0;
    if (hasExposedPorts) {
      //Nothing to expose
      const appName = getAppName(imageName);
      try {
        output = output + '\n' + await exposeService(appName);
        setDeployResponse(output);
      } catch (e) {
        toast.error(`Failed to expose '${appName}' for  ${imageName}`);
        output = output + '\n' + (e as any).stderr;
        setDeployResponse(output);
      }
      const route = await getProjectRoute(appName);
      if (route) {
        toast.success(`Deployed ${imageName} to ${route}.`);
        output += '\nApplication is exposed as: ' + route;
        output += '\nWaiting for ' + route + ' to be ready.\n'
        setDeployResponse(output);
        let waitRoute = route;
        if (process.env.NODE_ENV === 'development') {
          waitRoute = `${process.env.REACT_APP_CORS_PROXY_URL}/${route}`;
        }
        await waitOnUrl(`${waitRoute}`, WAITING_ON_URL_TIMEOUT, 1000, (out) => {
          output += out;
          setDeployResponse(output);
        }).then((response) => {
          openInBrowser(route);
          output += `\nApplication URL ${route} opened in browser`;
          setDeployResponse(output);
        }).catch((err) => {
          if (err) {
            console.log(err);
            const isNotAccessibleMessage = `Application URL ${route} is not accessible.`;
            output += `\n${isNotAccessibleMessage}`;
            toast.warning(isNotAccessibleMessage);
          } else {
            const isStillNotAccessibleMessage = `Application URL ${route} is still not accessible after ${WAITING_ON_URL_TIMEOUT / 1000} seconds.`;
            output += `\n${isStillNotAccessibleMessage}`;
            toast.warning(isStillNotAccessibleMessage);
          }
          setDeployResponse(output);
        });
      } else {
        toast.warning(`Deployed ${imageName} but no route was created.`);
      }
    } else {
      output = output + '\nNo exposed ports found, so no route is created.';
      setDeployResponse(output);
      toast.success(`Deployed ${imageName} but no route was created.`);
    }
  }

  const shadow = 0;

  const [deployView, setDeployView] = useLocalState('deployView', false);

  const showDeployPage = () => {
    setDeployView(true);
  }

  const showWelcomePage = () => {
    setDeployView(false);
  }

  // TODO: handle oc login (detect login / display instructions)
  // TODO: handle image no available from openshift cluster (either push or display instructions)
  // TODO: better handle deployment failures (project doesn't exist, service already exists, etc.)
  return (
    <Box
      display="flex"
      flexDirection="column"
      flexGrow={1}
      height="97vh"
      width="100%"
      padding="10px"
      boxShadow={shadow}
    >
      <Logo clickable={deployView} onClick={showWelcomePage} />
      {!deployView && (
        <Welcome onButtonClick={showDeployPage} />
      )}
      {deployView && (
        <>
          <Header />
          <CurrentContext />
          <ImageSelector onDeployClick={deploy} />
          <DeploymentOutput deployResponse={deployResponse} />
        </>
      )}
    </Box>
  );
}

