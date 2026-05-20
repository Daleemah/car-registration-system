const jwt = require("jsonwebtoken");
const { ApiError } = require("../utils/ApiError");
const { User } = require("../models/userModel");

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new ApiError(401, "No token, access denied"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.sub || decoded.id).select("-password");
    if (!user) return next(new ApiError(401, "User not found"));
    if (!user.isActive) return next(new ApiError(403, "Account is deactivated"));

    req.user = user;
    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new ApiError(401, "Token has expired — please log in again"));
    }
    return next(new ApiError(401, "Invalid token"));
  }
};

function requireRole(...roles) {
  return function (req, res, next) {
    if (!req.user) return next(new ApiError(401, "Not authenticated"));
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, `Forbidden — requires one of: [${roles.join(", ")}]`)
      );
    }
    return next();
  };
}

function requireOwnerOrRole(...roles) {
  return function (req, res, next) {
    if (!req.user) return next(new ApiError(401, "Not authenticated"));

    const ownerId = req.resource?.owner ?? req.resource?.applicantId;
    const isOwner = ownerId && String(ownerId) === String(req.user._id);
    const hasRole = roles.includes(req.user.role);

    if (!isOwner && !hasRole) {
      return next(new ApiError(403, "Forbidden — not the owner or insufficient role"));
    }
    return next();
  };
}

// protect is the main function; requireAuth is an alias for routes that use that name
const requireAuth = protect;

module.exports = { protect, requireAuth, requireRole, requireOwnerOrRole };