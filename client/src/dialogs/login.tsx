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
import { loadServerUrls, login } from '../utils/OcUtils';
import { createDockerDesktopClient } from '@docker/extension-api-client';
interface LoginDialogProps {
  install: (showDialog: () => void) => void;
  onLogin: () => void;
}

interface FieldState {
  value: string;
  helperText: string;
  error: boolean;
}

const DEFAULT_STATUS = { value: '', helperText: '', error: false };

export function LoginDialog(props: LoginDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [cluster, setCluster] = React.useState<FieldState>(DEFAULT_STATUS);
  const [username, setUsername] = React.useState<FieldState>(DEFAULT_STATUS);;
  const [password, setPassword] = React.useState<FieldState>(DEFAULT_STATUS);;
  const [servers, setServers] = React.useState([] as string[]);

  const validateUrl = (value: string): string => {
    return value && validator.isURL(value.trim()) ? '' : 'Invalid Cluster URL';
  }

  const validateUsername = (value: string): string => {
    return value?.trim().length > 0 ? '' : 'Username is empty';
  }

  const validatePassword = (value: string): string => {
    return value?.trim().length > 0 ? '' : 'Password is empty';
  }

  const isValid = (): boolean => {
    return cluster.helperText === '' && username.helperText === '' && password.helperText === '';
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

  const handleLogin = () => {
    login(cluster.value.split('://')[1], username.value, password.value).then(() => {
      ddClient.desktopUI.toast.success(`Sucessfully logged into cluster ${cluster.value}`);
      props.onLogin();
    }).catch((error) => {
      ddClient.desktopUI.toast.error(error);
    });
    handleClose();
  };

  const handleOpen = () => {
    setOpen(true);
    loadServerUrls().then((urls) => {
      setServers(urls);
    })
  }

  const handleClose = () => {
    setOpen(false);
    setCluster(DEFAULT_STATUS);
    setUsername(DEFAULT_STATUS);
    setPassword(DEFAULT_STATUS);
  }

  props.install(handleOpen);

  return (
    <div>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>OpenShift Login</DialogTitle>
        <DialogContent>
          <DialogContentText style= {{ marginBottom: '15px' }}>
            Provide OpenShift cluster URL, username and password to login.
          </DialogContentText>
          <Autocomplete
            freeSolo
            options={servers}
            onChange={(event, value) => handleOnChange(validateUrl, setCluster, { target: { value } })}
            renderInput={(params) => (
              <TextField {...params}
                sx={{
                  minHeight: "5rem",
                  '& .MuiInputLabel-formControl': {
                    paddingLeft: '10px',
                  }
                }}
                autoFocus
                id="cluster"
                label="Cluster URL"
                type="text"
                fullWidth
                required
                variant="outlined"
                onChange={handleOnChange.bind(undefined, validateUrl, setCluster)}
                value={cluster.value}
                helperText={cluster.helperText}
                error={cluster.error} />
            )}
          />
          <TextField
            sx={{
              minHeight: "5rem",
              '& .MuiInputLabel-formControl': {
                paddingLeft: '10px',
              }
            }}
            id="userName"
            label="Username"
            type="text"
            fullWidth
            variant="outlined"
            margin="normal"
            required
            onChange={handleOnChange.bind(undefined, validateUsername, setUsername)}
            value={username.value}
            helperText={username.helperText}
            error={username.error}
          />
          <TextField
            sx={{
              minHeight: "5rem",
              '& .MuiInputLabel-formControl': {
                paddingLeft: '10px',
              }
            }}
            id="password"
            label="Password"
            type="password"
            fullWidth
            variant="outlined"
            margin="normal"
            required
            onChange={handleOnChange.bind(undefined, validatePassword, setPassword)}
            value={password.value}
            helperText={password.helperText}
            error={password.error}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={handleClose}>Cancel</Button>
          <Button variant="contained" disabled={!isValid()} onClick={handleLogin}>Login</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}