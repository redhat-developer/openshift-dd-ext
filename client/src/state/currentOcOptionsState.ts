import { atom } from "recoil";
import { OcOptions } from "../models/OcOptions";

export const currentOcOptions = atom<OcOptions>({
  key: 'ocOptions',
  default: {
    skipTlsVerify: false,
  },
});
