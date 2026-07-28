import * as adminRequestService from "../services/adminRequestService.js";

export const list = async (req, res) => {
  const result = await adminRequestService.listPending(req.query);
  res.json(result);
};

export const approve = async (req, res) => {
  const result = await adminRequestService.approve(req.params.id, {
    comment: req.body?.comment,
    adminId: req.admin?.adminId || null,
  });
  res.json(result);
};

export const reject = async (req, res) => {
  await adminRequestService.reject(req.params.id, {
    comment: req.body?.comment,
    adminId: req.admin?.adminId || null,
  });
  res.json({ message: "Request rejected" });
};
