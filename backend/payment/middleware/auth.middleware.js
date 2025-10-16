// auth.middleware.js
import jwt from 'jsonwebtoken';
import axios from 'axios';


export const verifyToken = async (req, res, next) => {
  try {
    const raw = req.headers.authorization || '';
    if (!raw.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = raw.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const baseUser = { ...decoded, id: decoded.id || decoded._id };
    let finalUser = baseUser;
   
    if (process.env.VERIFY_WITH_AUTH === 'true') {
      const url = `${process.env.AUTH_URL || 'http://server-auth:3001'}/api/auth/me`;
      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });
      // Priorisiere die „Quelle der Wahrheit“ vom Auth-Service
      finalUser = { ...data, id: data.id || data._id || baseUser.id };
    }

    req.user = finalUser;
    return next(); // <-- EIN einziges next und danach KEIN Code mehr
  } catch (err) {

    const status =
      err?.name === 'TokenExpiredError' ? 401 :
        err?.name === 'JsonWebTokenError' ? 401 :
          403; // sonst Forbidden
    return res.status(status).json({ message: 'Unauthorized' });
  }
};

export const requireRole = (role) => (req, res, next) => {
  if (!req.user || !req.user.role) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  if (req.user.role !== role) {
    return res.status(403).json({ message: `${role} access only.` });
  }
  return next();
};

// Komfort-Guards
export const isAdmin = requireRole('admin');
export const isCreator = requireRole('creator');
