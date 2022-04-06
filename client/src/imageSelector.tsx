import { Button } from "@mui/material";
import { Box } from "@mui/system";
import { useEffect, useState } from "react";
import Select, { SingleValue } from "react-select";
import { getLocalImages } from "./utils/DockerUtils";
import { createDockerDesktopClient } from '@docker/extension-api-client';

interface ImageOption {
  readonly value: string;
  readonly label: string;
}

export function ImageSelector() {
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
        />
      </Box>
      <Button variant="contained" onClick={deploy} disabled={!selectedImage}> Deploy {selectedImage} </Button>
    </div>
  );
}