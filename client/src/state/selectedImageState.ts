import { atom } from "recoil";
import { ISelectedImage } from "../models/IDockerImage";

export const selectedImageState = atom<ISelectedImage|undefined>({
  key: 'selectedImageState',
  default: undefined
});