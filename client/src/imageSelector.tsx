import { RefreshRounded } from "@mui/icons-material";
import { Autocomplete, Button, TextField, Tooltip } from "@mui/material";
import { Box } from "@mui/system";
import { Suspense, useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import DeployButton from "./components/deployButton";
import { IDockerImage } from "./models/IDockerImage";
import { KubeContext, UnknownKubeContext } from "./models/KubeContext";
import { currentContextState } from "./state/currentContextState";
import { loginState } from "./state/loginState";
import { selectedImageState } from "./state/selectedImageState";
import { DeploymentMode } from "./utils/Deployer";
import { getLocalImages } from "./utils/DockerUtils";
import { UNSET_VALUE } from "./utils/OcUtils";
import { toast } from "./utils/UIUtils";

interface ImageSelectorProps {
  onDeployClick?: (mode: number, context: KubeContext, registry?: string) => void;
}

interface ImageOption {
  readonly value: string;
  readonly label: string;
}

export default function ImageSelector(props?: ImageSelectorProps) {
  const onDeployClick = props?.onDeployClick;
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<Map<string, IDockerImage>>(new Map());
  const [imageOptions, setImageOptions] = useState<ImageOption[]>([]);
  const [selectedImage, setSelectedImage] = useRecoilState(selectedImageState);
  const [selectedOption, setSelectedOption] = useState<ImageOption | null>(null);
  const [currentContext,] = useRecoilState(currentContextState);
  const [loggedIn,] = useRecoilState(loginState);

  async function loadImages(): Promise<void> {
    const refreshing = !initialLoading;
    const localImages = await getLocalImages();
    setInitialLoading(false);
    const sortedKeys = Array.from(localImages.keys()).sort();

    const options = sortedKeys.map(d => ({
      value: d,
      label: d
    } as ImageOption));
    setLoading(false);
    setImages(localImages);
    setImageOptions(options);
    if (refreshing) {
      toast.success('Reloaded image list');
    }
    return;
  }

  useEffect(() => {
    if (loading) {
      loadImages();
    }
  }, [loading]);

  const handleRefresh = () => {
    setSelectedImage(undefined);
    setSelectedOption(null);
    setLoading(true);
  }

  const deploy = (mode: DeploymentMode, context: KubeContext, registry?: string): void => {
    if (selectedImage && onDeployClick) {
      onDeployClick(mode, currentContext, registry);
    }
  }

  function handleSelection(event: any, imageOption: ImageOption | null) {
    console.log(`Selected image: ${imageOption}`);
    if (imageOption) {
      const name = imageOption?.label;
      const image = images.get(name);
      if (image) {
        setSelectedImage({ name, image });
        setSelectedOption(imageOption);
      }
    } else {
      setSelectedImage(undefined);
      setSelectedOption(null);
    }
  }
 
  const deployEnabled = currentContext !== UnknownKubeContext && loggedIn && currentContext.project !== UNSET_VALUE && selectedImage !== null;

  return (
    <>
      <Box margin="15px 0px 15px 0px" display="flex" flexDirection="row">
        <div style={{ flex: '1 1 auto' }}>
          <Autocomplete
            size="small"
            placeholder="Select an image to deploy"
            options={imageOptions}
            onChange={handleSelection}
            value={selectedOption}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select an image to deploy"
                inputProps={{
                  ...params.inputProps,
                  autoComplete: 'new-password', // disable autocomplete and autofill
                }}
              />
            )}
          />
        </div>
        <Tooltip title="Reload the list of local Docker images" placement='bottom-end'>
          <span>
            <Button size="large" variant="outlined" onClick={handleRefresh} style={{ marginLeft: '20px' }} disabled={loading}>
              <RefreshRounded /> Reload
            </Button>
          </span>
        </Tooltip>
        {/* Move tooltip to the top-end, so it doesn't overlap the drop-down menu */}
        <Suspense fallback={<Button size="large" variant="contained" style={{ marginLeft: '20px' }}>Loading options ...</Button>}>
        <Tooltip title="Deploy the selected image to OpenShift" placement='top-end'> 
          <span>
            <DeployButton onDeployClick={deploy} disabled={!deployEnabled}/>
          </span>
        </Tooltip>
        </Suspense>
      </Box>
    </>
  );
}