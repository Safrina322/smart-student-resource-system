import * as resourceRepository from "../repositories/resourceRepository.js";

export const listRecent = () => resourceRepository.findRecent(20);
