import { OpenInBrowser } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import { useRecoilValue } from "recoil";
import { currentContextLinksState } from "../state/currentContextState";
import { openInBrowser, toast } from "../utils/UIUtils";

export default function ConsoleButton() {
    const dashboardUrl = useRecoilValue(currentContextLinksState)?.dashboardUrl;

    function openConsoleDashboard() {
        if (dashboardUrl) {
          openInBrowser(dashboardUrl);
        } else {
          toast.warning('No dashboard URL available');
        }
    }
    if (!dashboardUrl) {
        return <></>;
    }
    return (
      <Tooltip title='Open Console Dashboard' placement='bottom-end'>
      <span>
        <IconButton
          aria-label="action"
          onClick={openConsoleDashboard}
        >
          <OpenInBrowser />
        </IconButton>
      </span>
      </Tooltip>
    );
}

