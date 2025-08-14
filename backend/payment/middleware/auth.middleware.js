import jwt from 'jsonwebtoken';
import axios from 'axios';

export const verifyToken = async (req, res, next) => {
 const raw = req.headers.authorization;
  if (!raw?.startsWith('Bearer ')) return res.status(401).json({ message: 'No token' });
  try {
    const token = raw.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { ...decoded, id: decoded.id || decoded._id }; // WICHTIG
    next();


    // Optional: Lokale Token-Validierung (nicht zwingend)
    jwt.verify(token, process.env.JWT_SECRET);

    // 🛰 Echten User vom Auth-Service holen
    const response = await axios.get('http://server-auth:3001/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const user = response.data; // Hier holst du den echten User aus der Antwort

    req.user = user; // Jetzt mit isSubscribed, role, etc.
    next();
  } catch (err) {
    console.error('Auth Error:', err.message);
    return res.status(403).json({ message: 'Unauthorized' });
  }
};

// Nur für Admin-Routen
export const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access only.' });
  }
  next();
};

// Nur für Creator-Routen
export const isCreator = (req, res, next) => {
  if (req.user.role !== 'creator') {
    return res.status(403).json({ message: 'Creator access only.' });
  }
  next();
};
