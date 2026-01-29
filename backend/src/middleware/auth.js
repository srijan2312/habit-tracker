import jwt from 'jsonwebtoken';
import { createLocalJWKSet, jwtVerify } from 'jose';

const getJwtHeader = (token) => {
  try {
    const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString());
    return header || {};
  } catch {
    return {};
  }
};

const ensureJwksAccessible = async (jwksUrl) => {
  console.log('Fetching JWKS from:', jwksUrl);
  const res = await fetch(jwksUrl, { method: 'GET' });
  const text = await res.text();
  console.log('JWKS response status:', res.status, res.statusText);
  console.log('JWKS response body:', text.slice(0, 500));
  if (!res.ok) {
    throw new Error(`JWKS fetch failed (${jwksUrl}): ${res.status} ${res.statusText} ${text.slice(0, 200)}`);
  }
  return text;
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
      const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
      
      if (!supabaseUrl) {
        console.error('SUPABASE_URL env var is not set');
        return res.status(500).json({ error: 'Server misconfiguration: missing SUPABASE_URL' });
      }
      
      if (!supabaseKey) {
        console.error('SUPABASE_KEY env var is not set');
        return res.status(500).json({ error: 'Server misconfiguration: missing SUPABASE_KEY' });
      }
      
      const jwksUrl = process.env.SUPABASE_JWKS_URL || new URL('/auth/v1/keys', supabaseUrl).toString();
      console.log('Using JWKS URL:', jwksUrl);
      console.log('SUPABASE_URL:', supabaseUrl);
      
      // Manually fetch JWKS with API key header (jose's createRemoteJWKSet doesn't properly pass custom headers)
      const jwksText = await ensureJwksAccessible(jwksUrl);
      const jwksHeaders = {
        apikey: supabaseKey,
      };
      
      // Fetch JWKS with API key
      const jwksRes = await fetch(jwksUrl, { 
        method: 'GET',
        headers: jwksHeaders 
      });
      
      if (!jwksRes.ok) {
        const errText = await jwksRes.text();
        throw new Error(`JWKS fetch with API key failed: ${jwksRes.status} ${jwksRes.statusText} ${errText.slice(0, 200)}`);
      }
      
      const jwksData = await jwksRes.json();
      console.log('JWKS data keys count:', jwksData.keys?.length || 0);
      
      const jwks = createLocalJWKSet(jwksData);
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
    console.error('JWT verification failed:', error?.name || 'Error', error?.message || error);
    if (error?.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token', details: error.message });
    }
    if (error?.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', details: error.message });
    }
    return res.status(401).json({ error: 'Authentication failed', details: error?.message || String(error) });
  }
};
