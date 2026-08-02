import { apiClient } from '../../shared/api/client';

export async function cancelContent(contentId, token) {
  const res = await apiClient.put(
    `/content/${contentId}`,
    { status: 'canceled' },
    { headers: { Authorization: `Bearer ${token}` }, withCredentials: true },
  );
  return res.data;
}

export async function getRouletteState(token) {
  const res = await apiClient.get('/roulette/state', { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

export async function rouletteSpin(token) {
  const res = await apiClient.post('/roulette/spin', {}, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

export async function rouletteReset(token) {
  const res = await apiClient.post('/roulette/reset', {}, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

export async function getPollState(token) {
  const res = await apiClient.get('/poll/state', { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

export async function createPoll(token, body) {
  const res = await apiClient.post('/poll/create', body, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

export async function openPoll(token) {
  const res = await apiClient.post('/poll/open', {}, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

export async function closePoll(token) {
  const res = await apiClient.post('/poll/close', {}, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

export async function resetPoll(token) {
  const res = await apiClient.post('/poll/reset', {}, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

export async function awardPollPrizes(token, body = {}) {
  const res = await apiClient.post('/poll/award', body, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

export async function refundPollPrizes(token, body = {}) {
  const res = await apiClient.post('/poll/refund', body, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

export async function getEnabledPlatforms() {
  return apiClient.get('/platforms/enabled');
}

