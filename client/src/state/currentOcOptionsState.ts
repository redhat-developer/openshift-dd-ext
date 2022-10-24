import { atom } from "recoil";
import { OcOptions } from "../models/OcOptions";

export const currentOcOptionsState = atom<OcOptions>({
  key: 'ocOptions',
  default: {
    skipTlsVerify: false,
  },
});
