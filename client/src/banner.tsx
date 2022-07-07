import { Alert, AlertColor, Box, Button, Link } from "@mui/material";
import { useRecoilState, useRecoilValue } from "recoil";
import { UnknownKubeContext } from "./models/KubeContext";
import { currentContextLinksState, currentContextState } from "./state/currentContextState";
import { loginState } from "./state/loginState";
import { selectedImageState } from "./state/selectedImageState";
import { UNSET_VALUE } from "./utils/OcUtils";
import { openInBrowser, toast } from "./utils/UIUtils";

export function Banner() {
    const tokenUrl = useRecoilValue(currentContextLinksState)?.tokenUrl;
    const [currentContext,] = useRecoilState(currentContextState);
    const [loggedIn,] = useRecoilState(loginState);
    const selectedImage = useRecoilValue(selectedImageState);
    let alertSeverity: AlertColor | undefined;
    let alertText: JSX.Element | undefined;

    [alertSeverity, alertText] = validation();

    function validation(): [AlertColor, JSX.Element] {
        let text: JSX.Element | undefined;
        let severity: AlertColor = 'warning';
        if (currentContext === UnknownKubeContext && !selectedImage) {
            text = <span>Select a context and an image to deploy</span>;
        } else if (currentContext === UnknownKubeContext) {
            text = <span>Select a context to deploy to</span>;
        } else if (!loggedIn) {
            //let tokenUrlLink = (tokenUrl)?<span>Get an <a href="#" onClick={openTokenUrl}>API token</a></span>:<></>;
            let tokenUrlLink = (tokenUrl) ? <Button size="small" variant="contained" onClick={openTokenUrl} style={{ marginLeft: '20px' }}>Get an API token ...</Button> : <></>;

            text = <span>You must be logged in the selected OpenShift cluster. {tokenUrlLink}</span>;
        } else if (currentContext.project === UNSET_VALUE) {
            text = <span>Select a project to deploy to</span>;
        } else if (!selectedImage) {
            text = <span>Select an image to deploy</span>;
        }
        if (!text) {
            severity = 'info';
            text = <>Deploying {selectedImage?.name} to project '{currentContext.project}' on <Link color="inherit" href="#" onClick={() => openInBrowser(currentContext.clusterUrl!!)}>{currentContext.clusterUrl}</Link></>;
        }
        return [severity, text];
    }

    function openTokenUrl() {
        if (tokenUrl) {
            openInBrowser(tokenUrl);
        } else {
            toast.warning('No token URL available');
        }
    }

    return (
        <Box marginBottom="15px">
            <Alert variant="filled" severity={alertSeverity}>
                {alertText}
            </Alert>
        </Box>
    );
}

export function LoadingBanner() {
    return (
        <Box marginBottom="15px">
            <Alert variant="filled" severity="info">
                Loading context data ...
            </Alert>
        </Box>
    );
}