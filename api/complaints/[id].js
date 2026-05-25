const { getStore, sendJson } = require("../_data");

module.exports = function handler(req, res) {
  const store = getStore();
  const { id } = req.query;

  if (req.method !== "PATCH") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const complaint = store.complaints.find((item) => item.id === id);
  if (!complaint) {
    sendJson(res, 404, { error: "Complaint not found" });
    return;
  }

  Object.assign(complaint, req.body || {});
  sendJson(res, 200, complaint);
};
