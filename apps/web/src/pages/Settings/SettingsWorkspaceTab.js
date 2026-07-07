import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Building2, Check, Loader2 } from 'lucide-react';
import { getWorkspaceTenants, switchActiveWorkspaceTenant } from '../../features/account/api';
import { devCatchLog } from '../../utils/devCatchLog';
import { useExternalPoll } from '../../hooks/useExternalPoll';

export default function SettingsWorkspaceTab({ user, setUser, setAuth, t }) {
  const [switchingId, setSwitchingId] = useState(null);

  const poll = useExternalPoll('settings-workspace-tenants', async () => {
    try {
      return await getWorkspaceTenants();
    } catch (e) {
      devCatchLog('SettingsWorkspaceTab.load', e);
      toast.error(t('settings.workspaceLoadError'));
      return null;
    }
  }, 0);

  const loading = poll.status === 'idle' || poll.status === 'loading';
  const payload = poll.status === 'ready' ? poll.data : null;

  const activeId =
    payload?.activeTenantId != null && Number.isFinite(Number(payload.activeTenantId))
      ? Number(payload.activeTenantId)
      : user?.tenantId != null && Number.isFinite(Number(user.tenantId))
        ? Number(user.tenantId)
        : null;

  const handleSwitch = async (tenantId) => {
    const tid = Number(tenantId);
    if (!Number.isFinite(tid)) return;
    if (activeId === tid) {
      toast.success(t('settings.workspaceAlreadyActive'));
      return;
    }
    setSwitchingId(tid);
    try {
      const data = await switchActiveWorkspaceTenant(tid);
      if (data?.token && data?.user && setAuth) {
        setAuth(data.user, data.token);
      } else if (data?.user && setUser) {
        setUser({ ...user, ...data.user, tenantId: tid });
      }
      toast.success(t('settings.workspaceSwitched'));
    } catch (e) {
      devCatchLog('SettingsWorkspaceTab.switch', e);
      toast.error(t('settings.workspaceSwitchError'));
    } finally {
      setSwitchingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          {t('settings.workspaceTitle') || 'Workspace'}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {t('settings.workspaceHelp') || 'Switch between organizations linked to your account.'}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          {t('common.loading')}
        </div>
      ) : !payload?.tenants?.length ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.workspaceEmpty') || 'No workspaces available.'}</p>
      ) : (
        <ul className="space-y-2">
          {payload.tenants.map((tenant) => {
            const tid = Number(tenant.id);
            const isActive = activeId === tid;
            return (
              <li
                key={tenant.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{tenant.name || tenant.slug || `Tenant ${tenant.id}`}</p>
                  {tenant.slug && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{tenant.slug}</p>}
                </div>
                <button
                  type="button"
                  disabled={isActive || switchingId === tid}
                  onClick={() => handleSwitch(tid)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-accent text-white disabled:opacity-50"
                >
                  {switchingId === tid ? <Loader2 className="w-4 h-4 animate-spin" /> : isActive ? <Check className="w-4 h-4" /> : null}
                  {isActive ? (t('settings.workspaceActive') || 'Active') : (t('settings.workspaceSwitch') || 'Switch')}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
