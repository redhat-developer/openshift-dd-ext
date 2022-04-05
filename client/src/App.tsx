import { createDockerDesktopClient } from '@docker/extension-api-client';
import { Box, Button } from '@mui/material';
import { useState } from 'react';
import Header from './Header';

import { DockerImageList } from './imageList';
import { ImageSelector } from './imageSelector';

export function App() {
  const useCombo = true;
  const shadow = 2;
  const [selectedImage, setSelectedImage] = useState('');

  const onImageSelection = (image: string | undefined): void => {
    console.log(`Selected image: ${image}`);
    setSelectedImage(image ? image : '');
  }

  const deploy = (): void => {
    if (selectedImage) {
      createDockerDesktopClient().desktopUI.toast.success(`Deployed ${selectedImage}!`);
    }
  }

  const Selector = (): JSX.Element => {
    if (useCombo) {
      return (
        <div className='flexbox-container'>
          <ImageSelector onSelection={onImageSelection} />
          <Button variant="contained" onClick={deploy} disabled={!selectedImage}> Deploy {selectedImage} </Button>
        </div>
      );
    }
    return (
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
