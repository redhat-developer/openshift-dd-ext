import { Box, Button } from '@mui/material';
import { useState } from 'react';
import Header from './Header';

import { DockerImageList } from './imageList';
import { ImageSelector } from './imageSelector';

export function App() {
  const useCombo = true;
  const shadow = 0;

  const Selector = (): JSX.Element => {
    return useCombo ? (
      <ImageSelector />
    ) : (
      <DockerImageList />
    );
  };

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
      <Selector />
    </Box>
  );
}
