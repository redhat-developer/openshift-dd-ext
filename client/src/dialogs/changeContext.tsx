import * as React from 'react';
import { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { isPropertyAssignment } from 'typescript';
import { Backdrop, Box, CircularProgress, Divider, List, ListItem, ListItemAvatar, ListItemButton, ListItemText, Typography } from '@mui/material';
import { loadContextUiData, readKubeConfig, setCurrentContext } from '../utils/OcUtils';
import { createDockerDesktopClient } from '@docker/extension-api-client';
import { UnknownKubeContext } from '../models/KubeContext';

interface LoginDialogProps {
  install: (showDialog: () => void) => void;
  onContextChange: () => void;
}

export function ChangeContext(props: LoginDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [kubeConfig, setKubeConfig] = React.useState();
  const [selectedContext, setSelectedContext] = React.useState('');
  const [contexts, setContexts] = React.useState([]);

  const ddClient = createDockerDesktopClient();

  const handleCancel = () => {
    setOpen(false);
  }

  const handleChange = () => {
    setOpen(false);
    setCurrentContext(selectedContext).catch((error) => {
      ddClient.desktopUI.toast.error('Setting current context failed.');
    }).then(() => {
      props.onContextChange();
    })
  };

  const handleOpen = () => {
    setLoading(true);
    setOpen(true)
    readKubeConfig().then((kubeConfig) => {
      setKubeConfig(kubeConfig);
      setContexts(kubeConfig.contexts ? kubeConfig.contexts : [])
      setSelectedContext(kubeConfig['current-context']);
      setTimeout(() => {
        setLoading(false)
      }, 1500);
    });
  }

  props.install(handleOpen);

  return (
    <div>
      <Dialog open={open} onClose={handleChange}>
        <DialogTitle>Change Context</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Select Context from the list below
          </DialogContentText>
          {(loading) && (
            <Box width="100%" component="div" display="flex" alignContent="center" justifyContent="center" padding="20px">
              <CircularProgress color="inherit" />
            </Box>
          )}
          {(!loading) && (
            <List sx={{ width: '100%' }}>
              {contexts.map((item: { name: string }, index: number) => {
                const contextUiData = loadContextUiData(kubeConfig, item.name);
                return (contextUiData !== UnknownKubeContext) && (
                  <>
                    <ListItemButton alignItems="flex-start" selected={item.name === selectedContext} onClick={() => setSelectedContext(item.name)} key={item.name}>
                      <ListItemText
                        primary={
                          <React.Fragment>
                            <Typography
                              sx={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis"
                              }}>
                              {item.name}
                            </Typography>
                          </React.Fragment>
                        }
                        secondary={
                          <React.Fragment>
                            <Typography
                              sx={{ display: 'inline' }}
                              component="span"
                              variant="body1"
                              color="text.primary"
                            >
                              <b>Cluster:</b> {contextUiData.clusterUrl}<br />
                              <b>Username:</b> {contextUiData.user}<br />
                              <b>Project:</b> {contextUiData.project}<br />
                            </Typography>
                          </React.Fragment>
                        }
                      />
                    </ListItemButton>
                    {(index + 1 < contexts.length) && (<Divider variant="fullWidth" />)}
                  </>
                )
              })
              }
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={handleCancel}>Cancel</Button>
          <Button variant="contained" disabled={loading || !kubeConfig || kubeConfig["current-context"] === selectedContext} onClick={handleChange}>Change</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}