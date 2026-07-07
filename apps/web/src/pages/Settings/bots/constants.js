import { getPublicFrontendOrigin } from '../../../shared/config/publicUrls';
import { getDefaultAkoenetSchedulerWebhookUrl } from '../../../shared/config/akoenetIntegration';

export const MASK = '••••••••••••••••';

export const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '') || (typeof window !== 'undefined' ? window.location.origin.replace(/\/$/, '') : '');
export const NIGHTBOT_TODO_URL = API_BASE ? `${API_BASE}/api/nightbot/todo` : '';
export const FRONTEND_ORIGIN = getPublicFrontendOrigin();
export const DEFAULT_AKOENET_WEBHOOK_URL = getDefaultAkoenetSchedulerWebhookUrl();

export const BOTS_SUB_IDS = ['community', 'integrations', 'overlays', 'commands'];
