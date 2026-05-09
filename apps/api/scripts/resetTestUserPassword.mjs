/**
 * Reset password for test@example.com (create user if missing).
 * Usage (Docker): docker compose run --rm streamautomator-api node scripts/resetTestUserPassword.mjs
 */
import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import { sequelize } from '../src/config/database.js';
import User from '../src/modules/users/infrastructure/User.model.js';
import { generateLicenseKey, generateUsernameSuffix } from '../src/utils/cryptoUtils.js';
import { resolveLicenseExpiry, normalizeLicenseType } from '../src/utils/licenseUtils.js';

const EMAIL = 'test@example.com';
const USERNAME = 'Test';
const PASSWORD = process.argv[2] || 'Test112233';

await sequelize.authenticate();
const hash = await bcrypt.hash(PASSWORD, 10);

let user = await User.findOne({ where: { email: EMAIL } });
if (!user) {
  const expiryResult = resolveLicenseExpiry({ licenseType: normalizeLicenseType('trial') });
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      user = await User.create({
        username: attempt === 0 ? USERNAME : `${USERNAME}${generateUsernameSuffix(3 + attempt)}`,
        email: EMAIL,
        passwordHash: hash,
        lastPasswordChange: new Date(),
        licenseType: normalizeLicenseType('trial'),
        licenseExpiresAt: expiryResult.error ? null : expiryResult.value,
        licenseKey: generateLicenseKey('TRIAL', 12),
        hasUsedTrial: true,
      });
      break;
    } catch (e) {
      if (e?.name === 'SequelizeUniqueConstraintError' && attempt < 7) continue;
      throw e;
    }
  }
  console.log(JSON.stringify({ ok: true, action: 'created', id: user.id, email: user.email, username: user.username }));
} else {
  user.passwordHash = hash;
  user.lastPasswordChange = new Date();
  if (user.username !== USERNAME) {
    user.username = USERNAME;
  }
  await user.save();
  console.log(JSON.stringify({ ok: true, action: 'updated', id: user.id, email: user.email, username: user.username }));
}

await sequelize.close();
