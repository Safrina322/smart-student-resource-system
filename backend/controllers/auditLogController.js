import * as auditLogService from "../services/auditLogService.js";

export const listRecent = async (req, res) => {
  const logs = await auditLogService.listRecent();
  res.json({ logs });
};
