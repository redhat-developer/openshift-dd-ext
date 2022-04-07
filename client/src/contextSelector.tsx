import { useEffect, useState } from 'react';
import { loadKubeContext } from './utils/OcUtils';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Menu, MenuItem } from '@mui/material';
import { KubeContext, UnknownKubeContext } from './models/KubeContext';
import { openInBrowser } from './utils/UIUtils';

export function CurrentContext() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentContext, setCurrentContext] = useState(UnknownKubeContext);
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
  const handleChangeContext = async () => {
    setAnchorEl(null);
    await loadContext();
  };

  async function loadContext(): Promise<void> {
    const context = await loadKubeContext();
    setCurrentContext(context);
  }

  useEffect(() => {
    if (loading) {
      loadContext();
    }
  }, [loading]);

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
        title={"Current context: " + currentContext.name}
        subheader={<p><b>Server:</b> <a onClick={openClusterPage} href="" style={styles.link}>{currentContext.clusterUrl}</a> <br /><b>Username</b> {currentContext.user}<br /><b>Project:</b> {currentContext.project}<br /></p>}
      />
    </Card >
  );
}