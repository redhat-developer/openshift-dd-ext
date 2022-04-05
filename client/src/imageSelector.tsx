import { Button } from "@mui/material";
import { Box } from "@mui/system";
import { useEffect, useState } from "react";
import Select, { SingleValue } from "react-select";
import { getLocalImages } from "./utils/DockerUtils";
interface ImageOption {
  readonly value: string;
  readonly label: string;
}
interface ImageSelectorProps {
  onSelection?: (image: string | undefined) => void;
}

export function ImageSelector(props: ImageSelectorProps) {
  const onSelection = props.onSelection;
  const [loading, setLoading] = useState(true);
  const [defaultImage, setDefaultImage] = useState('');
  const [images, setImages] = useState<ImageOption[]>([]);

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

  function handleSelection(image: SingleValue<ImageOption>) {
    if (onSelection) {
      onSelection(image?.value);
    }
  }

  return (
    //TODO align label and select
    <Box margin="15px 0px 15px 0px" width="70%">
      <Select
        noOptionsMessage={() => "No images found"}
        placeholder="Select an image to deploy"
        isClearable
        isSearchable
        options={images}
        onChange={handleSelection} //FIXME selection is lost once handleSelection is fired
      //defaultValue={defaultImage} 
      />
    </Box>
  );
}