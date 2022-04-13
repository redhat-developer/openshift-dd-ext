import * as React from 'react';
import { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { Backdrop, Box, CircularProgress, Divider, List, ListItem, ListItemAvatar, ListItemButton, ListItemText, Typography } from '@mui/material';
import { loadKubeContext, loadProjectNames, setCurrentContextProject } from '../utils/OcUtils';
import { createDockerDesktopClient } from '@docker/extension-api-client';

export interface ChangeProjectDialogProps {
  install: (showDialog: () => void) => void;
  onProjectChange: () => void;
}

export function ChangeProject(props: ChangeProjectDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [currentProject, setCurrentProject] = React.useState('');
  const [selectedProject, setSelectedProject] = React.useState('');
  const [projects, setProjects] = React.useState<string[]>([]);

  const ddClient = createDockerDesktopClient();

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = () => {
    setCurrentContextProject(selectedProject).catch((error) => {
      ddClient.desktopUI.toast.error('Setting current project for current context failed.');
    }).then(() => {
      setOpen(false)
      props.onProjectChange();
    });
  };

  const handleSelect = (value: string) => {
    setSelectedProject(value);
  }

  const handleOpen = () => {
    setLoading(true);
    setOpen(true)
    loadKubeContext().then((context) => {
      setCurrentProject(context.project ? context.project : '');
      setSelectedProject(context.project ? context.project : '');
      loadProjectNames().then((projects) => {
        setProjects(projects); 1
        setTimeout(() => {
          setLoading(false);
        }, 1500);
      }).catch((error) => {
        ddClient.desktopUI.toast.error(error);
        setOpen(false);
      });
    });
  }

  props.install(handleOpen);

  return (
    <div>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Change Project</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Select Project from the list below
          </DialogContentText>
          {(loading) && (
            <Box width="100%" component="div" display="flex" alignContent="center" justifyContent="center" padding="20px">
              <CircularProgress />
            </Box>
          )}
          {(!loading) && (
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
              {projects.map((project, index) => {
                return (
                  <>
                    <ListItemButton alignItems="flex-start" selected={project === selectedProject} onClick={() => handleSelect(project)} key={project}>
                      <ListItemText
                        primary={
                          <React.Fragment>
                            <Typography
                              sx={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis"
                              }}>
                              {project}
                            </Typography>
                          </React.Fragment>
                        }
                      />
                    </ListItemButton>
                    {(index + 1 < projects.length) && (<Divider variant="fullWidth" />)}
                  </>
                )
              })
              }
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={handleClose}>Cancel</Button>
          <Button variant="contained" disabled={currentProject === selectedProject || loading} onClick={handleChange}>Change</Button>
        </DialogActions>
      </Dialog >
    </div >
  );
}