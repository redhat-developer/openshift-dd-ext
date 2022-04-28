import { atom } from "recoil";
import { UnknownKubeContext } from "../models/KubeContext";

export const currentContextState = atom({
  key: 'contextState',
  default: UnknownKubeContext
});