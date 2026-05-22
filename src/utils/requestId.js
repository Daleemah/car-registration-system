const crypto = require("crypto");

function requestId(req, res, next) {
  const incoming = req.header("x-request-id");
  const id = incoming || crypto.randomUUID();
  req.requestId = id;
  res.setHeader("x-request-id", id);
  next();
}

module.exports = { requestId };
