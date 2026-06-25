/**
 * Public Cookie Policy page.
 * Content aligned with docs/legal/POLITICA_COOKIES.md.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import AppFooter from '../components/AppFooter';

export default function Cookies() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('cookies.backToApp') || 'Back to app'}
        </Link>

        <h1 className="text-3xl font-bold mb-2">{t('cookies.title') || 'Cookie policy'}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          {t('cookies.lastUpdated') || 'Last updated: May 2026'}
        </p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">{t('cookies.summaryTitle') || 'Summary'}</h2>
            <p>
              {t('cookies.summaryBody') ||
                'StreamAutomator does not load Google Analytics, Meta Pixel, or advertising cookies by default.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">
              {t('cookies.necessaryTitle') || 'Necessary storage'}
            </h2>
            <p>{t('cookies.necessaryIntro') || 'We use local storage / session cookies for:'}</p>
            <ul className="list-disc pl-6 my-2 space-y-1">
              <li>{t('cookies.necessaryAuth') || 'Authentication token'}</li>
              <li>{t('cookies.necessaryUi') || 'Interface preferences'}</li>
            </ul>
            <p>
              {t('cookies.necessaryNote') ||
                'No analytics consent banner is required because we do not use analytics cookies.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">{t('cookies.oauthTitle') || 'OAuth'}</h2>
            <p>
              {t('cookies.oauthBody') ||
                'When signing in with Google, Twitch, or other platforms, you are redirected to their domain; their policies apply.'}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">{t('cookies.moreTitle') || 'More information'}</h2>
            <p>
              <Link to="/privacy" className="text-accent hover:underline">
                {t('footer.privacy') || 'Privacy'}
              </Link>
              {' · '}
              <a href="mailto:privacy@streamautomator.com" className="text-accent hover:underline">
                privacy@streamautomator.com
              </a>
            </p>
          </section>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
