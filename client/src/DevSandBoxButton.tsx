import { Button, Tooltip } from "@mui/material";
import { openInBrowser } from "./utils/UIUtils";

interface DevSandBoxButtonProps {
  size?: "medium" | "small" | "large" | undefined,
  style?: React.CSSProperties,
}

export default function DevSandBoxButton(props?: DevSandBoxButtonProps) {

  return (
    <Tooltip title="Visit the Developer Sandbox for Red Hat OpenShift page">
      {/* links to https://developers.redhat.com/developer-sandbox/get-started?sc_cid=7013a0000030wG2AAI */}
      <Button variant="contained" onClick={() => openInBrowser('https://red.ht/3l2o59m')} size={props?.size} style={props?.style} >Need a free OpenShift Cluster?</Button>
    </Tooltip>
  );
}