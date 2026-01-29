import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const secret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'Missing JWT secret' });
    }

    const decoded = jwt.verify(token, secret);
    const userId = decoded.sub || decoded.userId || decoded.user_id;
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }
    req.userId = userId; // Attach verified userId to request
    req.user = decoded; // Attach full user data
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Authentication failed' });
  }
};
