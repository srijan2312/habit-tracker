import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No auth header or invalid format');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const secret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;
    if (!secret) {
      console.error('Missing JWT secret in environment');
      return res.status(500).json({ error: 'Missing JWT secret' });
    }

    console.log('Verifying token with secret:', secret.substring(0, 10) + '...');
    console.log('Token algorithm:', JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString()).alg);
    
    // Supabase uses ES256, not HS256 - we need to verify with the JWT secret as-is
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256', 'ES256'] });
    const userId = decoded.sub || decoded.userId || decoded.user_id;
    
    console.log('Token decoded successfully, userId:', userId);
    
    if (!userId) {
      console.error('No userId in token payload:', decoded);
      return res.status(401).json({ error: 'Invalid token payload' });
    }
    req.userId = userId; // Attach verified userId to request
    req.user = decoded; // Attach full user data
    
    next();
  } catch (error) {
    console.error('Token verification error:', error.message, error.name);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Authentication failed' });
  }
};
