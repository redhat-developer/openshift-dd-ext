import { LoginRounded } from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import ExpandLessRounded from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import { Box, Button, Card, CardContent, CardHeader, IconButton, Tooltip } from "@mui/material";
import { Suspense, useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import ConsoleButton from './components/consoleButton';
import RegistryUrl from './components/registryUrl';
import { ChangeContext } from './dialogs/changeContext';
import { ChangeProject } from './dialogs/changeProject';
import { LoginDialog } from './dialogs/login';
import { useLocalState } from './hooks/useStorageState';
import { UnknownKubeContext } from './models/KubeContext';
import { OcOptions } from './models/OcOptions';
import { currentContextState } from './state/currentContextState';
import { currentOcOptionsState } from './state/currentOcOptionsState';
import { loadKubeContext } from './utils/OcUtils';
import { openInBrowser } from './utils/UIUtils';

export default function CurrentContext() {
  const [loading, ] = useState(true);
  const [currentContext, setCurrentContext] = useRecoilState(currentContextState);
  const [contextNamesToOcOptions, setContextNamesToOcOptions] = useLocalState('ocOptions', {} as any);
  const [currentOcOptions, setCurrentOcOptions] = useRecoilState(currentOcOptionsState);
  const [expanded, setExpanded] = useState(false);
  
  const handleLogin = () => {
    showLoginDialog();
  };

  const handleChangeContext = async () => {
    showChangeContextDialog();
  };

  const handleChangeProject = () => {
    showChangeProjectDialog();
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  }

  let showLoginDialog: () => void;
  let showChangeContextDialog: () => void;
  let showChangeProjectDialog: () => void;

  const installDialog = (showDialogHandler: () => void) => {
    showLoginDialog = showDialogHandler;
  }

  const installChangeContextDialog = (showDialogHandler: () => void) => {
    showChangeContextDialog = showDialogHandler;
  }

  const installChangeProjectDialog = (showDialogHandler: () => void) => {
    showChangeProjectDialog = showDialogHandler;
  }

  function load() {
    loadContext().then(() => {
      loadOcOptions();
    });
  }

  async function loadContext(): Promise<void> {
    const context = await loadKubeContext();
    setCurrentContext(context);
  }

  function loadOcOptions() {
    if (currentContext.name) {
      const ocOptions: OcOptions = contextNamesToOcOptions[currentContext.name];
      if (ocOptions) {
        setCurrentOcOptions(ocOptions);
      }
    }
  }

  const onLogin = (ocOptions: OcOptions) => {
    loadContext().then(() => {
      if (currentContext.name) {
        setContextNamesToOcOptions({
          ...contextNamesToOcOptions,
          [currentContext.name]: ocOptions,
        });
      }
      loadOcOptions();
    });
  }

  useEffect(() => {
    if (loading) {
      load();
    }
  }, []);

  function openClusterPage() {
    if (currentContext.clusterUrl) {
      openInBrowser(currentContext.clusterUrl);
    }
  }

  const styles = {
    link: {
      color: '#00bcd4',
    }
  }

  const subHeader = (currentContext === UnknownKubeContext) ? "No context selected" : "Current context";

  return (
    <>
      <Card>
        <CardHeader
          action={
            <>
              <Suspense fallback={<Tooltip title='Looking up console link' placement='bottom-end'><span>...</span></Tooltip>}>
                <ConsoleButton />
              </Suspense>
              <Tooltip title='Login to an OpenShift cluster' placement='bottom-end'>
                <IconButton
                  aria-label="action"
                  onClick={handleLogin}>
                  <LoginRounded />
                </IconButton>
              </Tooltip>
              <Tooltip title='Change context' placement='bottom-end'>
                <IconButton
                  aria-label="action"
                  onClick={handleChangeContext}>
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={expanded ? "Collapse context details" : "Expand context details"} placement='bottom-end' >
                <IconButton
                  onClick={toggleExpand}>
                  {(expanded) && (
                    <ExpandLessRounded />
                  )}
                  {(!expanded) && (
                    <ExpandMoreRounded />
                  )}
                </IconButton>
              </Tooltip>
            </>
          }
          title={
            currentContext.name
          }
          subheader={subHeader}
        />
        <CardContent hidden={!expanded} sx={{ paddingTop: "0px" }}>
          <Box><b>Server:</b> <a onClick={openClusterPage} href="" style={styles.link}>{currentContext.clusterUrl}</a></Box>
          <Box><b>Container Registry:</b> <span>
            <Suspense fallback="...">
              <RegistryUrl/>
            </Suspense></span>
          </Box>
          <Box><b>User:</b> {currentContext.user}</Box>
          <Box><b>Project:</b> {currentContext.project}
            {(currentContext !== UnknownKubeContext) && (
              <Tooltip title='Select a different project to deploy to'>
                <Button sx={{ padding: 0 }} size="small" onClick={handleChangeProject}>Change</Button>
              </Tooltip>
            )}
          </Box>
          <Box><b>Skip TLS Verify:</b> {currentOcOptions.skipTlsVerify.toString()}</Box>
        </CardContent>
      </Card >
      <LoginDialog install={installDialog} onLogin={onLogin} />
      <ChangeContext install={installChangeContextDialog} onContextChange={load} showLoginDialog={handleLogin} />
      <ChangeProject install={installChangeProjectDialog} onProjectChange={load} />
    </>
  );
}