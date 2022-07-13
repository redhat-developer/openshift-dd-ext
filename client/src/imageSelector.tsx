import { RefreshRounded } from "@mui/icons-material";
import { Alert, Autocomplete, Button, Link, TextField, Tooltip } from "@mui/material";
import { Box } from "@mui/system";
import { useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import DeployButton from "./components/deployButton";
import { IDockerImage, ISelectedImage } from "./models/IDockerImage";
import { UnknownKubeContext } from "./models/KubeContext";
import { currentContextState } from "./state/currentContextState";
import { DeploymentMode } from "./utils/Deployer";
import { getLocalImages } from "./utils/DockerUtils";
import { UNSET_VALUE } from "./utils/OcUtils";
import { openInBrowser, toast } from "./utils/UIUtils";

interface ImageSelectorProps {
  onDeployClick?: (image: ISelectedImage, mode: number) => void;
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
  const [selectedImage, setSelectedImage] = useState<ISelectedImage | null>(null);
  const [selectedOption, setSelectedOption] = useState<ImageOption | null>(null);
  const [currentContext,] = useRecoilState(currentContextState);

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
    setSelectedImage(null);
    setSelectedOption(null);
    setLoading(true);
  }

  const deploy = (mode: DeploymentMode): void => {
    if (selectedImage && onDeployClick) {
      onDeployClick(selectedImage, mode);
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
      setSelectedImage(null);
      setSelectedOption(null);
    }
  }

  const deploymentText = () => {
    if (currentContext === UnknownKubeContext && !selectedImage) {
      return <span>Select a context and an image to deploy</span>;
    } else if (currentContext === UnknownKubeContext) {
      return <span>Select a context to deploy to</span>;
    } else if (currentContext.project === UNSET_VALUE) {
      return <span>Select a project to deploy to</span>;
    } else if (!selectedImage) {
      return <span>Select an image to deploy</span>;
    }
    return <>Deploying {selectedImage?.name} to project '{currentContext.project}' on <Link color="inherit" href="#" onClick={() => openInBrowser(currentContext.clusterUrl!!)}>{currentContext.clusterUrl}</Link></>;
  }

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
        <Tooltip title="Deploy the selected image to OpenShift" placement='top-end'> 
          <span>
            <DeployButton onDeployClick={deploy} disabled={!selectedImage}/>
          </span>
        </Tooltip>
      </Box>
      <Box marginBottom="15px">
        <Alert variant="filled" severity="info">
          {deploymentText()}
        </Alert>
      </Box>
    </>
  );
}