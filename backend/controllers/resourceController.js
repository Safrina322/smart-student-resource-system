import * as resourceService from "../services/resourceService.js";

export const listRecent = async (req, res) => {
  const resources = await resourceService.listRecent();
  res.json(resources);
};
