import { Box } from '@mui/material';
import { useState } from 'react';
import Logo from './components/logo';
import CurrentContext from './ContextCard';
import DeploymentOutput from './DeploymentOutput';
import Header from './Header';
import { useLocalState } from './hooks/useStorageState';
import ImageSelector from './imageSelector';
import { ISelectedImage } from './models/IDockerImage';
import { Deployer, DeploymentMode } from './utils/Deployer';
import { getMessage } from './utils/ErrorUtils';
import { openInBrowser, toast } from './utils/UIUtils';
import { waitOnUrl } from './utils/waitOnUrl';
import Welcome from './Welcome';

const WAITING_ON_URL_TIMEOUT = 30000;

export function App() {
  const [deployResponse, setDeployResponse] = useState("");

  async function deploy(selectedImage: ISelectedImage, mode: DeploymentMode) {
    const imageName = selectedImage.name;
    let output = "";
    const deployer = new Deployer(mode, { 
      onMessage(message) {
        setDeployResponse(output += `${message}\n`);
      },
      onFailure(message, error) {
        toast.error(message);
        setDeployResponse(output += `${getMessage(error)}\n`);
      },
      onNotExposed(message) {
        toast.warning(message);
        setDeployResponse(output += `${message}\n`);
      },
      async onRoute(route) {
        if (route) {
          toast.success(`Deployed ${imageName} to ${route}.`);
          await waitAndOpen(route, output);
        } else {
          toast.error(`Deployed ${imageName} but no route was created.`);
        }
      }
    });
    try {
      deployer.deploy(imageName);
    } catch (error) {
      toast.error(getMessage(error));
      setDeployResponse(output += `${getMessage(error)}\n`);
    }
  }

  async function waitAndOpen(route: string, currentOutput: string) {
    let waitRoute = route;
    if (process.env.NODE_ENV === 'development') {
      waitRoute = `${process.env.REACT_APP_CORS_PROXY_URL}/${route}`;
    }
    let output = currentOutput;
    await waitOnUrl(waitRoute, WAITING_ON_URL_TIMEOUT, 1000, (out) => {
      setDeployResponse(output += out);
    }).then((_response) => {
      openInBrowser(route);
      setDeployResponse(output += `\nApplication URL ${route} opened in browser\n`);
    }).catch((err) => {
      let message:string;
      if (err) {
        console.log(err);
        message = `Application URL ${route} is not accessible.`;
      } else {
        message = `Application URL ${route} is still not accessible after ${WAITING_ON_URL_TIMEOUT / 1000} seconds.`;
      }
      toast.warning(message);
      output += `\n${message}`;
      setDeployResponse(output);
    });
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

