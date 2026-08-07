/**
 * Public Terms of Service page.
 * Content aligned with docs/legal/TERMINOS_Y_CONDICIONES(.en).md
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import AppFooter from '../components/AppFooter';

function TermsEs() {
  return (
    <>
      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">1. Aceptación de los términos</h2>
        <p>
          Al acceder y utilizar StreamAutomator (&quot;el Servicio&quot;), aceptas quedar vinculado por los presentes
          Términos y condiciones. Si no estás de acuerdo con cualquiera de sus disposiciones, debes abstenerte de
          utilizar el Servicio.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">2. Propiedad intelectual e industrial</h2>
        <p>
          Todos los contenidos, funcionalidades y elementos del Servicio, incluyendo textos, diseños, código, logotipos,
          imágenes, bases de datos y software, son titularidad exclusiva de Dakinis Systems o de terceros autorizantes, y
          están protegidos por la normativa aplicable en materia de propiedad intelectual e industrial.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">3. Usos prohibidos</h2>
        <ul className="list-disc pl-6 my-2 space-y-1">
          <li>Copiar, reproducir, distribuir o comunicar públicamente el Servicio sin autorización.</li>
          <li>Modificar, adaptar o crear obras derivadas sin autorización expresa.</li>
          <li>Descompilar, realizar ingeniería inversa o intentar acceder al código fuente.</li>
          <li>Suprimir avisos de propiedad intelectual, marcas o derechos de autor.</li>
          <li>Usar el Servicio para fines ilícitos, fraudulentos o no autorizados.</li>
          <li>Intentar acceder sin autorización a sistemas, cuentas o datos de terceros.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">4. Cuentas de usuario</h2>
        <ul className="list-disc pl-6 my-2 space-y-1">
          <li>Eres responsable de mantener la confidencialidad de tus credenciales de acceso.</li>
          <li>Asumes la responsabilidad por toda actividad realizada desde tu cuenta.</li>
          <li>Debes notificar de inmediato cualquier acceso no autorizado o incidente de seguridad.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">5. Licencias y suscripciones</h2>
        <ul className="list-disc pl-6 my-2 space-y-1">
          <li>Las licencias son personales e intransferibles, salvo pacto expreso en contrario.</li>
          <li>Cada licencia habilita su uso para una única cuenta de usuario.</li>
          <li>Se prohíbe expresamente compartir, ceder o revender licencias sin autorización.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">6. Suspensión y terminación</h2>
        <p>
          Nos reservamos el derecho a suspender o cancelar, temporal o definitivamente, el acceso al Servicio cuando se
          detecte incumplimiento de estos términos, uso abusivo o conductas que puedan perjudicar a otros usuarios, al
          titular o a terceros.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">7. Exclusión de garantías</h2>
        <p>
          El Servicio se presta &quot;tal cual&quot; y &quot;según disponibilidad&quot;, sin garantías de ningún tipo, expresas o
          implícitas, incluyendo disponibilidad continua, adecuación a un fin concreto o ausencia total de errores.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">8. Limitación de responsabilidad</h2>
        <p>
          En la máxima medida permitida por la ley, Dakinis Systems no será responsable por daños indirectos,
          incidentales, especiales, consecuenciales, lucro cesante o pérdida de datos derivados del uso o imposibilidad
          de uso del Servicio.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">9. Privacidad y plataformas</h2>
        <p>
          El tratamiento de datos personales se regula en{' '}
          <Link to="/privacy" className="text-primary-600 dark:text-primary-400 underline">
            /privacy
          </Link>
          . Las integraciones OAuth (Google, Twitch, Discord, YouTube, X, Kick) están sujetas también a los términos de
          cada plataforma.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">10. Modificaciones y contacto</h2>
        <p>
          Nos reservamos el derecho a actualizar estos Términos en cualquier momento. Contacto legal:{' '}
          <a href="mailto:legal@streamautomator.com" className="text-primary-600 dark:text-primary-400 underline">
            legal@streamautomator.com
          </a>
        </p>
      </section>
    </>
  );
}

function TermsEn() {
  return (
    <>
      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">1. Acceptance of terms</h2>
        <p>
          By accessing and using StreamAutomator (&quot;the Service&quot;), you agree to be bound by these Terms and Conditions.
          If you disagree with any provision, you must not use the Service.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">2. Intellectual and industrial property</h2>
        <p>
          All content, features, and elements of the Service — including texts, designs, code, logos, images, databases,
          and software — are owned exclusively by Dakinis Systems or authorizing third parties and are protected by
          applicable intellectual and industrial property law.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">3. Prohibited uses</h2>
        <ul className="list-disc pl-6 my-2 space-y-1">
          <li>Copy, reproduce, distribute, or publicly communicate the Service without authorization.</li>
          <li>Modify, adapt, or create derivative works without express authorization.</li>
          <li>Decompile, reverse engineer, or attempt to access the source code.</li>
          <li>Remove intellectual property, trademark, or copyright notices.</li>
          <li>Use the Service for unlawful, fraudulent, or unauthorized purposes.</li>
          <li>Attempt unauthorized access to systems, accounts, or third-party data.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">4. User accounts</h2>
        <ul className="list-disc pl-6 my-2 space-y-1">
          <li>You are responsible for keeping your credentials confidential.</li>
          <li>You are responsible for all activity under your account.</li>
          <li>You must promptly report any unauthorized access or security incident.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">5. Licences and subscriptions</h2>
        <ul className="list-disc pl-6 my-2 space-y-1">
          <li>Licences are personal and non-transferable unless expressly agreed otherwise.</li>
          <li>Each licence enables use for a single user account.</li>
          <li>Sharing, assigning, or reselling licences without authorization is prohibited.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">6. Suspension and termination</h2>
        <p>
          We may suspend or permanently cancel access to the Service when we detect a breach of these terms, abusive use,
          or conduct that may harm other users, the operator, or third parties.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">7. Disclaimer of warranties</h2>
        <p>
          The Service is provided &quot;as is&quot; and &quot;as available&quot;, without warranties of any kind, express or implied,
          including continuous availability, fitness for a particular purpose, or complete absence of errors.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">8. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, Dakinis Systems is not liable for indirect, incidental, special,
          consequential damages, lost profits, or data loss arising from use of or inability to use the Service.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">9. Privacy and platforms</h2>
        <p>
          Personal data processing is governed by{' '}
          <Link to="/privacy" className="text-primary-600 dark:text-primary-400 underline">
            /privacy
          </Link>
          . OAuth integrations (Google, Twitch, Discord, YouTube, X, Kick) are also subject to each platform&apos;s terms.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">10. Changes and contact</h2>
        <p>
          We may update these Terms at any time. Legal contact:{' '}
          <a href="mailto:legal@streamautomator.com" className="text-primary-600 dark:text-primary-400 underline">
            legal@streamautomator.com
          </a>
        </p>
      </section>
    </>
  );
}

export default function Terms() {
  const { t, language } = useLanguage();
  const isEn = language === 'en';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('terms.backToApp') || 'Back to app'}
        </Link>

        <h1 className="text-3xl font-bold mb-2">{t('terms.title') || 'Terms of Service'}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          {t('terms.lastUpdated') || (isEn ? 'Last updated: 4 August 2026' : 'Última actualización: 4 agosto 2026')}
        </p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
          {isEn ? <TermsEn /> : <TermsEs />}
        </div>

        <Link
          to="/login"
          className="inline-flex items-center gap-2 mt-10 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('terms.backToApp') || 'Back to app'}
        </Link>
      </div>
      <AppFooter className="mt-12 py-6 px-4 border-t border-accent-light dark:border-gray-700 bg-accent-subtle dark:bg-gray-900 text-center text-gray-500 dark:text-gray-400 text-sm" />
    </div>
  );
}
