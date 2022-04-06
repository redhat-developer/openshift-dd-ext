import { Box } from '@mui/material';
import Header from './Header';

import { ImageSelector } from './imageSelector';

export function App() {
  const shadow = 0;
  return (
    <Box
      display="flex"
      flexDirection="column"
      flexGrow={1}
      height="97vh"
      width="100%"
      padding="10px"
      boxShadow={shadow}
    >
      <Header />
      <ImageSelector />
    </Box>
  );
}
