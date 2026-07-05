import { User } from '../modules/users/infrastructure/models.js';
import { streamautomatorVerifyIdpToken } from './idp-client.js';
import {
  loadOrProvisionStreamAutomatorUser,
  resolveTenantNumericId,
} from '../services/platformAuthBridge.js';
import { generateAuthData } from '../utils/authUtils.js';

/**
 * @param {string} platformToken
 */
export async function streamautomatorExchangeHubSsoToken(platformToken) {
  const identity = await streamautomatorVerifyIdpToken(platformToken);
  if (!identity) {
    const err = new Error('Token IdP inválido o expirado');
    err.status = 401;
    throw err;
  }

  const fakeReq = { get: () => '' };
  const tenantNumericId = await resolveTenantNumericId(
    { tenant: identity.tenant, tenantId: identity.tenant, role: identity.role },
    fakeReq
  );

  const existingBefore = identity.email
    ? await User.findOne({ where: { email: identity.email } })
    : null;

  const user = await loadOrProvisionStreamAutomatorUser({
    platformSub: identity.sub,
    email: identity.email,
    platformRole: identity.role,
    tenantNumericId,
  });

  if (!user) {
    const err = new Error('No se pudo provisionar usuario StreamAutomator');
    err.status = 500;
    throw err;
  }

  const authData = await generateAuthData(user, { activeTenantId: tenantNumericId ?? undefined });

  return {
    ...authData,
    provisioned: !existingBefore,
  };
}
