import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { isPropertyAssignment } from 'typescript';

interface LoginDialogProps {
  install: (showDialog: () => void) => void;
}

export function LoginDialog(props: LoginDialogProps) {
  const [open, setOpen] = React.useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpen = () => {
    setOpen(true)
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
          <TextField
            autoFocus
            margin="dense"
            id="clusterUrl"
            label="OpenShift Cluster URL"
            type="url"
            fullWidth
            variant="standard"
          />
          <TextField
            autoFocus
            margin="dense"
            id="userName"
            label="User name"
            type="text"
            fullWidth
            variant="standard"
          />
          <TextField
            autoFocus
            margin="dense"
            id="password"
            label="Password"
            type="password"
            fullWidth
            variant="standard"
          />
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleClose}>Login</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}