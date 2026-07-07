/** User-facing copy only — never show raw AkoeNet "Invalid scheduler webhook secret" in the UI. */
export function mapAkoenetGuildsLoadError(err, t) {
  const data = err.response?.data;
  const code = data?.code;
  if (code === 'akoenet_discovery_not_implemented') return null;
  if (data?.reason === 'secret_mismatch') return t('bots.akoenetIntegrationAuthFailed');
  const raw = String(data?.details || data?.error || '');
  if (/invalid.*secret|scheduler webhook secret/i.test(raw)) return t('bots.akoenetIntegrationAuthFailed');
  if (code === 'akoenet_not_configured' || code === 'akoenet_invalid_webhook_url') {
    return data?.details || data?.error || t('bots.akoenetServersUnavailable');
  }
  if (err.response?.status === 503) return t('bots.akoenetServersUnavailable');
  return t('bots.akoenetServersUnavailable');
}
