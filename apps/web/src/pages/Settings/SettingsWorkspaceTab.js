import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Building2, Check, Loader2 } from 'lucide-react';
import { getWorkspaceTenants, switchActiveWorkspaceTenant } from '../../features/account/api';
import { devCatchLog } from '../../utils/devCatchLog';

export default function SettingsWorkspaceTab({ user, setUser, setAuth, t }) {
  const [loading, setLoading] = useState(true);
  const [switchingId, setSwitchingId] = useState(null);
  const [payload, setPayload] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWorkspaceTenants();
      setPayload(data);
    } catch (e) {
      devCatchLog('SettingsWorkspaceTab.load', e);
      toast.error(t('settings.workspaceLoadError'));
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

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
      await load();
    } catch (e) {
      devCatchLog('SettingsWorkspaceTab.switch', e);
      const msg = e.response?.data?.error || e.message;
      toast.error(msg || t('settings.workspaceSwitchError'));
    } finally {
      setSwitchingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Building2 className="w-5 h-5" aria-hidden />
          {t('settings.workspace')}
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('settings.workspaceDescription')}</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>{t('settings.workspaceLoading')}</span>
        </div>
      ) : !payload?.tenants?.length ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.workspaceNoTenants')}</p>
      ) : (
        <ul className="space-y-3">
          {payload.tenants.map((row) => {
            const tenant = row.tenant;
            if (!tenant) return null;
            const tid = Number(tenant.id);
            const isActive = activeId !== null && tid === activeId;
            const busy = switchingId === tid;
            return (
              <li
                key={tid}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{tenant.name}</span>
                    {isActive && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded-full">
                        <Check className="w-3.5 h-3.5" aria-hidden />
                        {t('settings.workspaceActive')}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 break-all">
                    {tenant.slug} · {t('settings.workspacePlan')}: {tenant.plan || 'free'} · {t('settings.workspaceRole')}:{' '}
                    {row.role || 'member'}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={busy || isActive}
                  onClick={() => handleSwitch(tid)}
                  className="flex-shrink-0 px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isActive ? t('settings.workspaceCurrent') : t('settings.workspaceSwitch')}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
