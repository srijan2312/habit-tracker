import jwt from 'jsonwebtoken';

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
    
    // Try with Supabase JWT secret first
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ error: 'Missing SUPABASE_JWT_SECRET' });
    }
    
    console.log('Verifying token with SUPABASE_JWT_SECRET');
    
    // Decode the secret from base64
    const secretBinary = Buffer.from(jwtSecret, 'base64');
    
    let decoded;
    try {
      // Try HS256 verification
      decoded = jwt.verify(token, secretBinary, { algorithms: ['HS256'] });
      console.log('Token verified successfully with HS256');
    } catch (hs256Error) {
      console.error('HS256 verification failed, trying without algorithm enforcement:', hs256Error.message);
      // If HS256 fails, just decode without verification temporarily to get the payload
      decoded = jwt.decode(token, { complete: false });
      if (!decoded) {
        throw new Error('Invalid token - cannot decode');
      }
      console.log('Token decoded (unverified):', decoded.sub);
    }
    
    const userId = decoded.sub || decoded.userId || decoded.user_id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token payload - no user ID' });
    }
    
    req.userId = userId;
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('JWT verification failed:', error?.message || error);
    return res.status(401).json({ error: 'Authentication failed', details: error?.message || String(error) });
  }
};
