/**
 * Verifica JWT de acceso del IdP central (platform/auth).
 */

import jwt from 'jsonwebtoken';
import { getPlatformJwtAudience, getPlatformJwtIssuer } from './jwtAccess.js';

const ALG = 'HS256';

/**
 * @param {string} token
 * @param {string} secret
 */
export function verifyPlatformIdpAccessToken(token, secret) {
  return jwt.verify(token, secret, {
    algorithms: [ALG],
    issuer: getPlatformJwtIssuer(),
    audience: getPlatformJwtAudience(),
  });
}
