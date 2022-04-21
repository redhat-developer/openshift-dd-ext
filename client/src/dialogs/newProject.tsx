import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import validator from 'validator';
import { createProject, loadServerUrls, login } from '../utils/OcUtils';
import { createDockerDesktopClient } from '@docker/extension-api-client';

interface LoginDialogProps {
  install: (showDialog: () => void) => void;
  onCreate: () => void;
}

interface FieldState {
  value: string;
  helperText: string;
  error: boolean;
}

const DEFAULT_STATUS = { value: '', helperText: '', error: false };

export function NewProjectDialog(props: LoginDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState<FieldState>(DEFAULT_STATUS);

  const validateName = (value: string): string => {
    return value?.trim().length > 0 ? '' : 'Project Name is empty';
  }

  const handleOnChange = (validator: (value: string) => string, setter: React.Dispatch<React.SetStateAction<FieldState>>, event: any): void => {
    const helperText = validator(event.target.value);
    setter({
      value: event.target.value,
      helperText,
      error: helperText.length > 0
    });
  }

  const ddClient = createDockerDesktopClient();

  const handleCreateProject = () => {
    createProject(name.value).then(() => {
      ddClient.desktopUI.toast.success(`New Project '${name.value}' created.`);
      props.onCreate();
    }).catch((error) => {
      ddClient.desktopUI.toast.error(error);
    });
    handleClose();
  };

  const handleOpen = () => {
    setOpen(true);
  }

  const handleClose = () => {
    setOpen(false);
    setName(DEFAULT_STATUS);
  }

  props.install(handleOpen);

  return (
    <div>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Create new OpenShift Project</DialogTitle>
        <DialogContent>
          <DialogContentText style={{ marginBottom: '15px' }}>
            Provide Name for New OpenShift Project.
          </DialogContentText>
          <TextField
            sx={{
              minHeight: "5rem",
              '& .MuiInputLabel-formControl': {
                paddingLeft: '10px',
              }
            }}
            id="name"
            label="Project Name"
            type="text"
            fullWidth
            variant="filled"
            margin="normal"
            required
            onChange={handleOnChange.bind(undefined, validateName, setName)}
            value={name.value}
            helperText={name.helperText}
            error={name.error}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={handleClose}>Cancel</Button>
          <Button variant="contained" disabled={name.value.trim() === ''} onClick={handleCreateProject}>Create</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}