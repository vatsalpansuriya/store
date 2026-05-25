const { getStore, sendJson } = require("./_data");

module.exports = function handler(req, res) {
  const store = getStore();

  if (req.method === "GET") {
    sendJson(res, 200, store.complaints);
    return;
  }

  if (req.method === "POST") {
    store.complaints.unshift(req.body || {});
    sendJson(res, 201, req.body || {});
    return;
  }

  sendJson(res, 405, { error: "Method not allowed" });
};
