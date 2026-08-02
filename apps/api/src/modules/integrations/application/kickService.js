/**
 * Kick API Service
 * OAuth 2.1 + PKCE, token refresh, channels/livestreams, event subscriptions.
 */

import crypto from 'crypto';
import axios from 'axios';
import logger from '../../../utils/logger.js';

const KICK_ID_BASE = 'https://id.kick.com';
const KICK_API_BASE = 'https://api.kick.com/public/v1';

/** Scopes alineados con la app Kick Dev (v1 usa user/channel/events; el resto queda listo). */
export const KICK_SCOPES = [
  'user:read',
  'streamkey:read',
  'channel:read',
  'channel:write',
  'channel:rewards:read',
  'channel:rewards:write',
  'chat:write',
  'events:subscribe',
  'moderation:ban',
  'moderation:chat_message:manage',
  'kicks:read',
];

/** Embedded Kick public key (fallback if /public-key fetch fails). */
const KICK_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAq/+l1WnlRrGSolDMA+A8
6rAhMbQGmQ2SapVcGM3zq8ANXjnhDWocMqfWcTd95btDydITa10kDvHzw9WQOqp2
MZI7ZyrfzJuz5nhTPCiJwTwnEtWft7nV14BYRDHvlfqPUaZ+1KR4OCaO/wWIk/rQ
L/TjY0M70gse8rlBkbo2a8rKhu69RQTRsoaf4DVhDPEeSeI5jVrRDGAMGL3cGuyY
6CLKGdjVEM78g3JfYOvDU/RvfqD7L89TZ3iN94jrmWdGz34JNlEI5hqK8dd7C5EF
BEbZ5jgB8s8ReQV8H+MkuffjdAj3ajDDX3DOJMIut1lBrUVD1AaSrGCKHooWoL2e
twIDAQAB
-----END PUBLIC KEY-----`;

let kickPublicKeyCache = { pem: null, fetchedAt: 0 };

export function isKickConfigured() {
  return Boolean(
    String(process.env.KICK_CLIENT_ID || '').trim() &&
      String(process.env.KICK_CLIENT_SECRET || '').trim()
  );
}

export function getKickRedirectUri() {
  const override = String(process.env.KICK_REDIRECT_URI || '').trim();
  if (override) return override;
  const base = (process.env.BACKEND_URL || process.env.PUBLIC_API_URL || 'http://localhost:5000').replace(
    /\/$/,
    ''
  );
  return `${base}/api/kick/callback`;
}

export function generateKickPkce() {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
}

export class KickService {
  constructor() {
    this.clientId = String(process.env.KICK_CLIENT_ID || '').trim();
    this.clientSecret = String(process.env.KICK_CLIENT_SECRET || '').trim();
  }

  getAuthorizeUrl({ state, codeChallenge, redirectUri, scopes = KICK_SCOPES }) {
    if (!this.clientId) throw new Error('Kick client id not configured');
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: redirectUri || getKickRedirectUri(),
      scope: scopes.join(' '),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
    return `${KICK_ID_BASE}/oauth/authorize?${params.toString()}`;
  }

  async exchangeCode({ code, codeVerifier, redirectUri }) {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Kick credentials not configured');
    }
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: redirectUri || getKickRedirectUri(),
      code_verifier: codeVerifier,
      code,
    });
    const response = await axios.post(`${KICK_ID_BASE}/oauth/token`, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return this.#normalizeTokenResponse(response.data);
  }

  async refreshUserAccessToken(refreshToken) {
    if (!this.clientId || !this.clientSecret || !refreshToken) {
      throw new Error('Kick credentials or refresh token not available');
    }
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken,
    });
    const response = await axios.post(`${KICK_ID_BASE}/oauth/token`, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return this.#normalizeTokenResponse(response.data);
  }

  #normalizeTokenResponse(data) {
    if (!data?.access_token) {
      throw new Error('Kick token response missing access_token');
    }
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || null,
      expiresAt: data.expires_in ? new Date(Date.now() + Number(data.expires_in) * 1000) : null,
      scopes: data.scope
        ? String(data.scope)
            .split(/\s+/)
            .filter(Boolean)
        : [],
    };
  }

  async makeRequest(endpoint, accessToken, options = {}) {
    if (!accessToken) throw new Error('Kick access token not available');
    const method = (options.method || 'GET').toUpperCase();
    const config = {
      method,
      url: `${KICK_API_BASE}${endpoint}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    };
    if (options.body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      config.headers['Content-Type'] = 'application/json';
      config.data = options.body;
    }
    if (options.params) config.params = options.params;

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      logger.error('Kick API request failed', {
        endpoint,
        method,
        error: error.message,
        status: error.response?.status,
        responseData: error.response?.data,
      });
      throw error;
    }
  }

  async getUsers(accessToken) {
    const data = await this.makeRequest('/users', accessToken);
    return Array.isArray(data?.data) ? data.data : [];
  }

  async getChannels(accessToken, { broadcasterUserId } = {}) {
    const params = {};
    if (broadcasterUserId != null) params.broadcaster_user_id = broadcasterUserId;
    const data = await this.makeRequest('/channels', accessToken, { params });
    return Array.isArray(data?.data) ? data.data : [];
  }

  async getLivestreams(accessToken, { broadcasterUserId } = {}) {
    const params = {};
    if (broadcasterUserId != null) params.broadcaster_user_id = broadcasterUserId;
    const data = await this.makeRequest('/livestreams', accessToken, { params });
    return Array.isArray(data?.data) ? data.data : [];
  }

  /**
   * @returns {{ live: boolean, title: string|null, slug: string|null, viewerCount: number|null, stream: object|null }}
   */
  async getLivestreamByUserId(accessToken, broadcasterUserId) {
    const streams = await this.getLivestreams(accessToken, { broadcasterUserId });
    const stream = streams[0] || null;
    if (!stream) {
      return { live: false, title: null, slug: null, viewerCount: null, stream: null };
    }
    return {
      live: true,
      title: stream.stream_title || stream.title || null,
      slug: stream.slug || null,
      viewerCount: stream.viewer_count ?? null,
      stream,
    };
  }

  async subscribeLivestreamEvents(accessToken, { broadcasterUserId } = {}) {
    const body = {
      method: 'webhook',
      events: [
        { name: 'livestream.status.updated', version: 1 },
        { name: 'livestream.metadata.updated', version: 1 },
      ],
    };
    if (broadcasterUserId != null) body.broadcaster_user_id = Number(broadcasterUserId);
    const data = await this.makeRequest('/events/subscriptions', accessToken, {
      method: 'POST',
      body,
    });
    return Array.isArray(data?.data) ? data.data : data;
  }

  async getPublicKeyPem() {
    const now = Date.now();
    if (kickPublicKeyCache.pem && now - kickPublicKeyCache.fetchedAt < 24 * 60 * 60 * 1000) {
      return kickPublicKeyCache.pem;
    }
    try {
      const response = await axios.get(`${KICK_API_BASE}/public-key`, {
        headers: { Accept: 'application/json' },
      });
      const pem = response.data?.data?.public_key || response.data?.public_key;
      if (pem && String(pem).includes('BEGIN PUBLIC KEY')) {
        kickPublicKeyCache = { pem: String(pem).trim(), fetchedAt: now };
        return kickPublicKeyCache.pem;
      }
    } catch (error) {
      logger.warn('Kick public-key fetch failed; using embedded key', { error: error.message });
    }
    kickPublicKeyCache = { pem: KICK_PUBLIC_KEY_PEM, fetchedAt: now };
    return KICK_PUBLIC_KEY_PEM;
  }

  /**
   * Verify Kick-Event-Signature over messageId.timestamp.rawBody (RSA-SHA256).
   */
  async verifyWebhookSignature({ messageId, timestamp, rawBody, signatureHeader }) {
    if (!messageId || !timestamp || !signatureHeader) return false;
    const pem = await this.getPublicKeyPem();
    const payload = `${messageId}.${timestamp}.${typeof rawBody === 'string' ? rawBody : String(rawBody || '')}`;
    try {
      const signature = Buffer.from(String(signatureHeader), 'base64');
      return crypto.verify(
        'sha256',
        Buffer.from(payload),
        { key: pem, padding: crypto.constants.RSA_PKCS1_PADDING },
        signature
      );
    } catch (error) {
      logger.warn('Kick webhook signature verify error', { error: error.message });
      return false;
    }
  }
}

export default KickService;
