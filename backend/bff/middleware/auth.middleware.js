// middleware/auth.js
import jwt from "jsonwebtoken";

// Basis-Auth: prüft, ob ein gültiges Token vorhanden ist
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  console.log(`[verifyToken] ${req.method} ${req.originalUrl}`);
  console.log(`[verifyToken] hasAuthHeader=${Boolean(authHeader)} prefix=${authHeader?.split(" ")[0] || "NONE"}`);

  if (!authHeader?.startsWith("Bearer ")) {
    console.warn("[verifyToken] ❌ No Bearer token");
    return res.status(401).json({ message: "No token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // hier ruhig einmal ausgeben, aber sensible Daten nicht komplett leaken
    console.log("[verifyToken] ✅ decoded:", {
      id: decoded.id || decoded._id,
      role: decoded.role,
      hasEmail: Boolean(decoded.email),
    });

    // Vereinheitlichen: id statt _id
    req.user = {
      ...decoded,
      id: decoded.id || decoded._id,
    };

    return next();
  } catch (err) {
    console.error("[verifyToken] ❌ Invalid token:", err.message);
    return res.status(403).json({ message: "Invalid token" });
  }
};

export const isAdmin = (req, res, next) => {
  console.log("[isAdmin] req.user =", {
    id: req.user?.id,
    role: req.user?.role,
  });

  if (req.user?.role !== "admin") {
    console.warn(`[isAdmin] ❌ role=${req.user?.role} (required: admin)`);
    return res.status(403).json({ message: "Admin access only" });
  }
  console.log("[isAdmin] ✅ admin ok");
  next();
};

// Nur für Creator-Routen
export const isCreator = (req, res, next) => {
  console.log("[isCreator] req.user =", {
    id: req.user?.id,
    role: req.user?.role,
  });

  if (req.user?.role !== "creator") {
    console.warn(`[isCreator] ❌ role=${req.user?.role} (required: creator)`);
    return res.status(403).json({ message: "Creator access only." });
  }
  console.log("[isCreator] ✅ creator ok");
  next();
};
