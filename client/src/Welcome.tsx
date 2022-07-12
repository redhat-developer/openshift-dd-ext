import { Box, Button, CardMedia, Typography } from "@mui/material";
import DevSandBoxButton from "./components/devSandBoxButton";
import { openInBrowser } from "./utils/UIUtils";

interface WelcomeProps {
  onButtonClick: () => void;
}

export default function Welcome(props: WelcomeProps) {

  return (
  <Box width="100%" alignContent="center" display="flex" flexDirection="column" flexWrap="nowrap" alignItems="center">
    <Typography variant="h6" component="div">
      <a href="#" onClick={()=> openInBrowser("https://www.redhat.com/en/technologies/cloud-computing/openshift?sc_cid=7013a0000030wG2AAI")}>Red Hat® OpenShift®</a> is an enterprise-ready Kubernetes container platform built for an open hybrid cloud strategy.
      It provides a consistent application platform to manage hybrid cloud, multicloud, and edge deployments.
    </Typography>
    <Typography variant='body1'>
      <DevSandBoxButton size="large"  style={{ margin: '30px 30px 30px 0px' }} />
      <Button variant="contained" size="large" style={{ margin: '30px 30px 30px 30px' }} onClick={props.onButtonClick}>Deploy to OpenShift</Button>
    </Typography>
    <Box minWidth={800} minHeight={450} display="flex">
      <CardMedia
        component="iframe"
        image="https://www.youtube.com/embed/xEofcsd6HGg"
      />
    </Box>
    
  </Box>
  );
}