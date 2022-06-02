import { Box } from "@mui/material";

interface DeploymentOutputProps {
  deployResponse: string;
}

export default function DeploymentOutput(props: DeploymentOutputProps) {

  const output = props?.deployResponse;

  return (
    <Box
      display="flex"
      flexDirection="column"
      flexGrow={1}
      width="100%"
    >
      <textarea style={{ height: '80%' }} value={output} readOnly />
    </Box>
  );
}