import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import AppFooter from '../../../components/AppFooter';
import { SA_LEGAL_DOCS } from '../legal-docs';

export default function LegalStaticPage() {
  const { slug } = useParams();
  const { t, language } = useLanguage();
  const doc = SA_LEGAL_DOCS[slug];

  if (!doc) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t('legal.notFound') || 'Document not found'}</p>
      </div>
    );
  }

  const title = language === 'en' && doc.titleEn ? doc.titleEn : doc.title;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('legal.backToApp') || 'Back to app'}
        </Link>

        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          {t('legal.lastUpdated') || 'Last updated'}: {doc.updated}
        </p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
          {doc.sections.map((section) => (
            <section key={section.h}>
              <h2 className="text-xl font-semibold mt-6 mb-2">{section.h}</h2>
              <p>{section.p}</p>
            </section>
          ))}
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
