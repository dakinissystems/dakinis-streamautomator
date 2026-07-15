import { apiClient } from '../../../shared/api/client.js';

export async function getDirectorActive() {
  const { data } = await apiClient.get('/director/active');
  return data;
}

export async function startDirector(body = {}) {
  const { data } = await apiClient.post('/director/start', body);
  return data;
}

export async function completeDirectorStep(sessionId, stepId) {
  const { data } = await apiClient.post(`/director/${sessionId}/steps/${stepId}/complete`);
  return data;
}

export async function endDirectorSession(sessionId) {
  const { data } = await apiClient.post(`/director/${sessionId}/end`);
  return data;
}

export async function getAutomationCatalog() {
  const { data } = await apiClient.get('/automation/catalog');
  return data;
}

export async function getAutomationRules() {
  const { data } = await apiClient.get('/automation/rules');
  return data.items || [];
}

export async function createAutomationRule(body) {
  const { data } = await apiClient.post('/automation/rules', body);
  return data;
}

export async function updateAutomationRule(id, body) {
  const { data } = await apiClient.patch(`/automation/rules/${id}`, body);
  return data;
}

export async function deleteAutomationRule(id) {
  const { data } = await apiClient.delete(`/automation/rules/${id}`);
  return data;
}

export async function seedAutomationDefaults() {
  const { data } = await apiClient.post('/automation/rules/seed-defaults');
  return data;
}

export async function toggleAutomationRule(id, enabled) {
  const { data } = await apiClient.patch(`/automation/rules/${id}`, { enabled });
  return data;
}

export async function getWorkspaceWidgets() {
  const { data } = await apiClient.get('/workspace/widgets');
  return data;
}

export async function getCalendarReadiness(limit = 5) {
  const { data } = await apiClient.get('/creator/readiness', { params: { limit } });
  return data;
}

export async function getCreatorAnalytics(days = 30) {
  const { data } = await apiClient.get('/creator/analytics', { params: { days } });
  return data;
}

export async function suggestCopilot(body) {
  const { data } = await apiClient.post('/creator/copilot/suggest', body);
  return data;
}

export async function getCampaignKits() {
  const { data } = await apiClient.get('/creator/campaign-kits');
  return data.items || [];
}

export async function previewCampaignKit(kitId, params = {}) {
  const { data } = await apiClient.get(`/creator/campaign-kits/${kitId}/preview`, { params });
  return data;
}

export async function getSchedulerSuggestions(days = 14) {
  const { data } = await apiClient.get('/creator/scheduler/suggest', { params: { days } });
  return data;
}

export async function applyCampaignKit(kitId, body = {}) {
  const { data } = await apiClient.post(`/creator/campaign-kits/${kitId}/apply`, body);
  return data;
}
