import * as React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Menu, MenuItem } from '@mui/material';

export function CurrentContext() {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: any) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  }
  const handleLogin = () => {
    setAnchorEl(null);
  };
  const handleChangeProject = () => {
    setAnchorEl(null);
  };
  const handleChangeContext = () => {
    setAnchorEl(null);
  };
  return (
    <Card>
      <CardHeader
        action={
          <>
            <IconButton
              aria-label="settings"
              onClick={handleClick}>
              <MoreVertIcon />
            </IconButton>
            <Menu
              id="long-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}>
              <MenuItem onClick={handleLogin}>Login into cluster</MenuItem>
              <MenuItem onClick={handleChangeProject}>Change Project</MenuItem>
              <MenuItem onClick={handleChangeContext}>Change Context</MenuItem>
            </Menu>
          </>
        }
        title="Context-Name-from-Kubeconfig"
        subheader={<p><b>Server:</b> http://severname.com:8080<br /><b>Username</b> Developer<br /><b>Project:</b> project-name<br /></p>}
      />
    </Card>
  );
}