import * as analyticsEventService from "../services/analyticsEventService.js";

export const trackEvent = async (req, res) => {
  await analyticsEventService.trackEvent(req.user.id, req.body);
  res.json({ message: "Event tracked" });
};
