function requestLogger(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const log = {
      requestId: req.requestId || "-",
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration: `${Date.now() - start}ms`,
      ip: req.ip || req.connection?.remoteAddress || "-",
      userId: req.user ? String(req.user._id) : "anonymous",
      userAgent: req.headers["user-agent"] || "-",
    };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(log));
  });

  next();
}

module.exports = { requestLogger };
