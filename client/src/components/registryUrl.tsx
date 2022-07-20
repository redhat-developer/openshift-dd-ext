import { useRecoilValue } from "recoil";
import { currentOpenShiftRegistryState } from "../state/currentContextState";

export default function RegistryUrl() {
    const registryUrl = useRecoilValue(currentOpenShiftRegistryState);

    return (registryUrl)?<>{registryUrl}</>:<>Unavailable</>;
}
