import * as auditLogRepository from "../repositories/auditLogRepository.js";

export const listRecent = () => auditLogRepository.findRecent(100);
