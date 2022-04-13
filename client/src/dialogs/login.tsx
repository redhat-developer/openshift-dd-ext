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
import { login } from '../utils/OcUtils';
import { createDockerDesktopClient } from '@docker/extension-api-client';
import { PropaneSharp } from '@mui/icons-material';

interface LoginDialogProps {
  install: (showDialog: () => void) => void;
  onLogin: () => void;
}

interface FieldState {
  value: string;
  helperText: string;
}

export function LoginDialog(props: LoginDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [cluster, setCluster] = React.useState<FieldState>({ value: '', helperText: '' });
  const [username, setUsername] = React.useState<FieldState>({ value: '', helperText: '' });;
  const [password, setPassword] = React.useState<FieldState>({ value: '', helperText: '' });;

  const validateUrl = (value: string): string => {
    return validator.isURL(value.trim()) ? '' : 'Invalid Cluster URL';
  }

  const validateUsername = (value: string): string => {
    return value.trim().length > 0 ? '' : 'Username is empty';
  }

  const validatePassword = (value: string): string => {
    return value.trim().length > 0 ? '' : 'Password is empty';
  }

  const isValid = (): boolean => {
    return cluster.helperText === '' && username.helperText === '' && password.helperText === '';
  }

  const handleOnChange = (validator: (value: string) => string, setter: React.Dispatch<React.SetStateAction<FieldState>>, event: any): void => {
    setter({
      value: event.target.value,
      helperText: validator(event.target.value)
    });
  }

  const ddClient = createDockerDesktopClient();

  const handleLogin = () => {
    setOpen(false);
    login(cluster.value.split('://')[1], username.value, password.value).then(() => {
      ddClient.desktopUI.toast.success(`Sucessfully logged into cluster ${cluster.value}`);
      props.onLogin();
    }).catch((error) => {
      ddClient.desktopUI.toast.error(error);
    });
  };

  const handleOpen = () => {
    setOpen(true);
  }

  const handleClose = () => {
    setOpen(false);
  }

  props.install(handleOpen);

  return (
    <div>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>OpenShift Login</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Provide OpenShift cluster URL, username and password to login.
          </DialogContentText>
          <Autocomplete
            freeSolo
            options={[]}
            renderInput={(params) => (
              <TextField {...params}
                autoFocus margin="dense"
                id="cluster"
                label="Cluster URL"
                type="text"
                fullWidth
                variant="filled"
                onChange={handleOnChange.bind(undefined, validateUrl, setCluster)}
                value={cluster.value}
                helperText={cluster.helperText}
                error={cluster.helperText !== ""} />
            )}
          />
          <TextField
            autoFocus
            margin="dense"
            id="userName"
            label="User name"
            type="text"
            fullWidth
            variant="filled"
            onChange={handleOnChange.bind(undefined, validateUsername, setUsername)}
            value={username.value}
            helperText={username.helperText}
            error={username.helperText !== ""}
          />
          <TextField
            autoFocus
            margin="dense"
            id="password"
            label="Password"
            type="password"
            fullWidth
            variant="filled"
            onChange={handleOnChange.bind(undefined, validatePassword, setPassword)}
            value={password.value}
            helperText={password.helperText}
            error={password.helperText !== ""}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={handleClose}>Cancel</Button>
          <Button variant="contained" disabled={!isValid()} onClick={handleLogin}>Login</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}