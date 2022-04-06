import { Box } from "@mui/material";

interface DeploymentOutputProps {
  deployResponse: string;
}

export function DeploymentOutput(props: DeploymentOutputProps) {

  let output = props?.deployResponse;

  return (
    <Box
      display="flex"
      flexDirection="column"
      flexGrow={1}
      width="100%"
      paddingTop="10px"
    >
      <textarea style={{ height: '50%' }} value={output} readOnly />
    </Box>
  );
}