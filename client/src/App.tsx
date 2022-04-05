import { Box, Button} from '@mui/material';

import { createDockerDesktopClient } from '@docker/extension-api-client';
import { DockerImageList } from './imageList';

export function App() {
  const ddClient = createDockerDesktopClient();

  function sayHello() {
    ddClient.desktopUI.toast.success('Hello, World!');
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      flexGrow={1}
      height="100vh"
      width="100%"
    >
        <DockerImageList />
    </Box>
  );
}
