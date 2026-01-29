import jwt from 'jsonwebtoken';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const getJwtHeader = (token) => {
  try {
    const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString());
    return header || {};
  } catch {
    return {};
  }
};

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No auth header or invalid format');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const header = getJwtHeader(token);
    const alg = header.alg || 'HS256';

    let decoded;
    if (alg.startsWith('HS')) {
      const secret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;
      if (!secret) {
        return res.status(500).json({ error: 'Missing JWT secret' });
      }
      decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
    } else {
      const supabaseUrl = process.env.SUPABASE_URL;
      if (!supabaseUrl) {
        return res.status(500).json({ error: 'Missing SUPABASE_URL' });
      }
      const jwks = createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/keys`));
      const { payload } = await jwtVerify(token, jwks, { algorithms: ['ES256'] });
      decoded = payload;
    }
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
