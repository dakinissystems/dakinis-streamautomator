import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  getStreamItems,
  deleteSuggestion,
  updateTodo,
} from './api';
import { apiClient } from '../../shared/api/client';

vi.mock('../../shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('features/content/api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls stream-items with optional type and sort', async () => {
    apiClient.get.mockResolvedValue({ data: { items: [] } });
    await getStreamItems('event', 'oldest');

    expect(apiClient.get).toHaveBeenCalledWith('/stream-items', {
      params: { type: 'event', sort: 'oldest' },
    });
  });

  it('deletes suggestion by id', async () => {
    apiClient.delete.mockResolvedValue({});
    await deleteSuggestion(42);
    expect(apiClient.delete).toHaveBeenCalledWith('/suggestions/42');
  });

  it('patches todo update payload', async () => {
    apiClient.patch.mockResolvedValue({ data: { ok: true } });
    await updateTodo(5, { title: 'A', completed: true, order: 2 });

    expect(apiClient.patch).toHaveBeenCalledWith('/todos/5', {
      title: 'A',
      completed: true,
      order: 2,
    });
  });
});
