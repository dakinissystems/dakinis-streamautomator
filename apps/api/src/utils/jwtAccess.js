/**
 * Verificación de access tokens para StreamAutomator: IdP central o JWT local del API.
 */

import jwt from 'jsonwebtoken';

const ALG = 'HS256';

export function getPlatformJwtIssuer() {
  return process.env.JWT_ISSUER || 'platform-auth';
}

export function getPlatformJwtAudience() {
  return process.env.JWT_AUDIENCE || 'dakinis-platform';
}

export function getStreamautomatorJwtIssuer() {
  return process.env.JWT_STREAMAUTOMATOR_ISSUER || 'streamautomator-api';
}

export function getStreamautomatorJwtAudience() {
  return process.env.JWT_STREAMAUTOMATOR_AUDIENCE || 'streamautomator';
}

function isStrictIssAud() {
  return String(process.env.JWT_STRICT_ISS_AUD || '').toLowerCase() === 'true';
}

/**
 * @param {string} token
 * @param {string} secret
 * @returns {object} payload
 */
export function verifyStreamautomatorAccessToken(token, secret) {
  const pairs = [
    [getPlatformJwtIssuer(), getPlatformJwtAudience()],
    [getStreamautomatorJwtIssuer(), getStreamautomatorJwtAudience()],
  ];

  for (const [issuer, audience] of pairs) {
    try {
      return jwt.verify(token, secret, { algorithms: [ALG], issuer, audience });
    } catch {
      /* siguiente */
    }
  }

  if (!isStrictIssAud()) {
    try {
      const decoded = jwt.verify(token, secret, { algorithms: [ALG] });
      if (decoded && decoded.iss == null) return decoded;
    } catch {
      /* inválido */
    }
  }

  const err = new Error('Invalid token');
  err.name = 'JsonWebTokenError';
  throw err;
}
