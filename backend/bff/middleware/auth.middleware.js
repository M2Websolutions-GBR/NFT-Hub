import jwt from 'jsonwebtoken';


// Basis-Auth: prüft, ob ein gültiges Token vorhanden ist
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // enthält id
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};


export const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access only' });
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
