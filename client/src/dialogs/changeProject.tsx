import { createDockerDesktopClient } from '@docker/extension-api-client';
import { Box, CircularProgress, Divider, List, ListItem, ListItemButton, ListItemText, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import * as React from 'react';
import { useRecoilValue } from 'recoil';
import { currentOcOptions } from '../state/currentOcOptionsState';
import { getMessage } from '../utils/ErrorUtils';
import { loadKubeContext, loadProjectNames, setCurrentContextProject } from '../utils/OcUtils';
import { NewProjectDialog } from './newProject';

export interface ChangeProjectDialogProps {
  install: (showDialog: () => void) => void;
  onProjectChange: () => void;
}

export function ChangeProject(props: ChangeProjectDialogProps) {
  const ocOptions = useRecoilValue(currentOcOptions);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [changing, setChanging] = React.useState(false);
  const [currentProject, setCurrentProject] = React.useState('');
  const [selectedProject, setSelectedProject] = React.useState('');
  const [projects, setProjects] = React.useState<string[]>([]);

  const ddClient = createDockerDesktopClient();

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = () => {
    setChanging(true);
    setCurrentContextProject(ocOptions, selectedProject).catch((error) => {
      console.error(error);
      ddClient.desktopUI.toast.error('Setting current project for current context failed.');
    }).then(() => {
      setChanging(false);
      setOpen(false)
      props.onProjectChange();
    });
  };

  const handleSelect = (value: string) => {
    setSelectedProject(value);
  }

  const selectAndClose = (value: string) => {
    setSelectedProject(value);
    handleChange();
  }

  const handleOpen = () => {
    setLoading(true);
    setOpen(true)
    loadKubeContext().then((context) => {
      setCurrentProject(context.project ? context.project : '');
      setSelectedProject(context.project ? context.project : '');
      loadProjectNames(ocOptions).then((projects) => {
        setProjects(projects); 1
        setLoading(false);
      }).catch((error) => {
        console.error(error);
        ddClient.desktopUI.toast.error(getMessage(error));
        setOpen(false);
      });
    });
  }

  let showNewProjectDialog: () => void;

  const installNewProjectDialog = (showDialogHandler: () => void) => {
    showNewProjectDialog = showDialogHandler;
  }

  const onProjectCreated = () => {
    props.onProjectChange();
  }

  const handleNewProject = () => {
    setOpen(false);
    showNewProjectDialog();
  };

  props.install(handleOpen);

  return (
    <div>
      <Dialog open={open} onClose={handleClose} fullWidth={true} PaperProps={{
        sx: {
          minWidth: 500,
          minHeight: 570,
          maxHeight: 570
        }
      }}>
        <DialogTitle>Change Project</DialogTitle>
        <DialogContent>
          <DialogContentText paddingBottom="16px">
            <Typography
              component="span"
              variant="body1"
              color="text.primary">
              Select Project from the list below
            </Typography>
          </DialogContentText>
          {(loading || changing) && (
            <Box width="100%" component="div" display="flex" alignContent="center" justifyContent="center" padding="20px">
              <CircularProgress />
            </Box>
          )}
          {(!loading && !changing) && (
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
              {projects.map((project, index) => {
                return (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemButton alignItems="flex-start" selected={project === selectedProject} 
                        onClick={() => handleSelect(project)} 
                        onDoubleClick={() => selectAndClose(project)}>
                        <ListItemText
                          primary={
                            <Typography
                              component="span"
                              sx={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis"
                              }}>
                              {project}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                    {(index + 1 < projects.length) && (<Divider variant="fullWidth" />)}
                  </React.Fragment>
                )
              })
              }
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ padding: "0 24px 20px 24px" }}>
          <Button variant="outlined" disabled={loading} onClick={handleNewProject}> New Project</Button>
          <div style={{ flex: '1 0 0' }} />
          <Button variant="outlined" onClick={handleClose}>Cancel</Button>
          <Button variant="contained" disabled={currentProject === selectedProject || loading} onClick={handleChange}>Change</Button>
        </DialogActions>
      </Dialog >
      <NewProjectDialog install={installNewProjectDialog} onCreate={onProjectCreated} existingProjects={projects} />
    </div >
  );
}