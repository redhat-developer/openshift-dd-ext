import { Box } from "@mui/material";
import { useEffect, useRef } from "react";

interface DeploymentOutputProps {
  deployResponse: string;
}

export default function DeploymentOutput(props: DeploymentOutputProps) {

  const output = props?.deployResponse;
  const textArea = useRef<HTMLTextAreaElement>(null);
  
  // After render, this scrolls the textArea to the bottom.
  useEffect(() => {
    if (textArea.current != null) {
      const area = textArea.current;
      area.scrollTop = area.scrollHeight;
    }
  },[output]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      flexGrow={1}
      width="100%"
      justify-content="flex-end" 
    >
      <textarea ref={textArea} style={{ height: '80%' }} value={output} readOnly />
    </Box>
  );
}
