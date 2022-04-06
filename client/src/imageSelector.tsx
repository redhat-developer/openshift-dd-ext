import { Button } from "@mui/material";
import { Box, styled } from "@mui/system";
import { useEffect, useState } from "react";
import Select, { SingleValue, StylesConfig } from "react-select";
import { getLocalImages } from "./utils/DockerUtils";
import { createDockerDesktopClient } from '@docker/extension-api-client';
import { useTheme } from '@mui/material';

interface ImageOption {
  readonly value: string;
  readonly label: string;
}

export function ImageSelector(props: any) {
  const [loading, setLoading] = useState(true);
  const [defaultImage, setDefaultImage] = useState('');
  const [images, setImages] = useState<ImageOption[]>([]);
  const [selectedImage, setSelectedImage] = useState('');

  async function loadImages(): Promise<void> {
    const localImages = await getLocalImages();
    const options = localImages.map(d => ({
      value: d,
      label: d
    } as ImageOption));
    setLoading(false);
    setImages(options);
    return;
  }

  useEffect(() => {
    if (loading) {
      loadImages();
    }
  }, [loading]);

  const onImageSelection = (image: string | undefined): void => {
    console.log(`Selected image: ${image}`);
    setSelectedImage(image ? image : '');
  }

  const deploy = (): void => {
    if (selectedImage) {
      createDockerDesktopClient().desktopUI.toast.success(`Deployed ${selectedImage}!`);
    }
  }

  function handleSelection(image: SingleValue<ImageOption>) {
    if (onImageSelection) {
      onImageSelection(image?.value);
    }
  }
  const dockerTheme = useTheme();
  return (
    <div className='flexbox-container'>
      <Box margin="15px 0px 15px 0px" width="70%">
        <Select
          noOptionsMessage={() => "No images found"}
          placeholder="Select an image to deploy"
          isClearable
          isSearchable
          options={images}
          onChange={handleSelection}
          value={images.filter(image => image.label === selectedImage)}
          theme={(theme) => ({
            ...theme,
            colors: {
              ...theme.colors,
              // primary: 'hotpink' // selected input border color
              primary25: dockerTheme.palette.primary.light, // option highlight color
              // primary50: 'hotpink' // unknown
              // primary75: 'hotpink' //unknown 
              neutral0: dockerTheme.palette.background.default, // background
              // neutral5: 'hotpink',
              // neutral10: 'green',
              // neutral20: 'yellow', // inactive input field border
              // neutral30: 'blue',
              // neutral40: 'hotpink', // mouse hoover over x to clean filter and combo button \/ icon
              neutral50: dockerTheme.palette.text.secondary, // input field placeholder text
              // neutral60: 'yellow', // selected combo x and \/ icon colors
              // neutral70: 'hotpink' // unknown
              neutral80: dockerTheme.palette.text.secondary, // text color for selectd value in input field
              // neutral90: 'yellow', // unknown
              // danger: 'hotpink' // unknown

            },
          })}
        />
      </Box>
      <Button variant="contained" onClick={deploy} disabled={!selectedImage}> Deploy {selectedImage} </Button>
    </div>
  );
}