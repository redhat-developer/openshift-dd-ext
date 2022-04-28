import { Box, Button, Typography, Card, CardMedia } from '@mui/material';
import { useState } from 'react';
import { CurrentContext } from './ContextCard';
import { DeploymentOutput } from './DeploymentOutput';
import Header from './Header';

import { ImageSelector } from './imageSelector';
import { ISelectedImage } from './models/IDockerImage';
import { deployImage, exposeService, getAppName, getProjectRoute } from './utils/OcUtils';
import { openInBrowser, toast } from './utils/UIUtils';
import React from 'react';
import Logo from './logo';
import { getLocalImageInspectionJson } from './utils/DockerUtils';

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
        //TODO wait for the route to be accessible before opening it?
        //TODO or rather display a link?
        openInBrowser(route);
        output = output + '\nApplication is exposed as: ' + route;
        setDeployResponse(output);
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

  const [deployView, setDeployView] = React.useState(false);

  const handleDeployPage = () => {
    setDeployView(true);
  }

  // TODO handle kube context and then
  // TODO: handle oc login (detect login / display instructions)
  // TODO: add openshift project selector
  // TODO: handle image no available from openshift cluster (either push or display instructions)
  // TODO: handle deployment failures (project doesn't exist, service already exists, etc.)
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
      <Logo />
      {!deployView && (
        <>
          <Box width="100%" alignContent="center" display="flex" flexDirection="column" flexWrap="nowrap" alignItems="center">
            <Typography variant="h6" component="div">
              Red Hat® OpenShift® is an enterprise-ready Kubernetes container platform built for an open hybrid cloud strategy.
              It provides a consistent application platform to manage hybrid cloud, multicloud, and edge deployments.
            </Typography>
            <Typography variant='body1'>
              <Button variant="contained" size="large" style={{ margin: '30px 0px 30px 0px' }} onClick={handleDeployPage}>Deploy to OpenShift</Button>
            </Typography>
            <Box minWidth={800} minHeight={450} display="flex">
              <CardMedia
                component="iframe"
                image="https://www.youtube.com/embed/xEofcsd6HGg"
              />
            </Box>
          </Box>
        </>
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

