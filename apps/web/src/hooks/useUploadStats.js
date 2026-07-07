import { useExternalPoll } from './useExternalPoll';
import { getUploadStats } from '../utils/uploadHelper';
import { devCatchLog } from '../utils/devCatchLog';

export function useUploadStats(userId, refreshKey = 0) {
  const id = userId ? String(userId) : '';
  const poll = useExternalPoll(
    id ? `upload-stats-${id}-${refreshKey}` : 'upload-stats-idle',
    async () => {
      try {
        return await getUploadStats(id);
      } catch (error) {
        devCatchLog('useUploadStats.load', error);
        return null;
      }
    },
    0
  );

  return poll.status === 'ready' ? poll.data : null;
}
