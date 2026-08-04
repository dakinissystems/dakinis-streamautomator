/**
 * Public Privacy Policy page.
 * Used for OAuth consent screen and general compliance.
 * Content aligned with apps/streamautomator/docs/legal/PRIVACIDAD(.en).md
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import AppFooter from '../components/AppFooter';

const UPDATED_ES = 'Última actualización: 4 de agosto de 2026';
const UPDATED_EN = 'Last updated: 4 August 2026';

function PrivacyEs() {
  return (
    <>
      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">1. Responsable del tratamiento</h2>
        <p>
          Dakinis Systems (nombre comercial de Christian David Villar Colodro) es responsable del tratamiento de los
          datos personales recabados a través de StreamAutomator (&quot;el Servicio&quot;). Esta política describe qué datos
          tratamos, con qué finalidad y cuáles son tus derechos (RGPD / LOPDGDD).
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">2. Datos que recopilamos</h2>
        <p>Podemos tratar las siguientes categorías de datos:</p>
        <ul className="list-disc pl-6 my-2 space-y-1">
          <li><strong>Datos de cuenta:</strong> nombre de usuario, correo electrónico e información de perfil.</li>
          <li>
            <strong>Datos OAuth:</strong> tokens e identificadores de plataformas conectadas (Google, Twitch, Discord,
            YouTube, X y Kick), necesarios para publicación, estado en directo, webhooks y funciones que actives.
          </li>
          <li>
            <strong>Contenido generado:</strong> publicaciones programadas, eventos, archivos multimedia y configuración
            de encuestas/overlays.
          </li>
          <li>
            <strong>Clave API de bot/overlay:</strong> autentica webhooks (p. ej. Nightbot) y overlays OBS.
          </li>
          <li>
            <strong>Datos de uso y diagnóstico:</strong> interacciones, logs técnicos y métricas de seguridad.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">3. Finalidades y base jurídica</h2>
        <ul className="list-disc pl-6 my-2 space-y-1">
          <li>Prestar y ejecutar el contrato de uso del Servicio (cuenta, autenticación y licencias).</li>
          <li>Publicar o programar contenido y recibir eventos de plataformas vinculadas (incl. Kick).</li>
          <li>Seguridad, prevención de fraude e incidencias técnicas (interés legítimo).</li>
          <li>Cumplir obligaciones legales aplicables.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">4. Datos de Google (login y YouTube)</h2>
        <p>
          Si conectas Google para iniciar sesión o vincular YouTube, usamos las APIs de Google conforme a la{' '}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 dark:text-primary-400 underline"
          >
            Política de datos de usuario de Google API Services
          </a>
          . Scopes mínimos: login <code>profile</code>/<code>email</code>; YouTube <code>youtube.upload</code>/
          <code>youtube.readonly</code>. No vendemos datos de Google. Revoca en{' '}
          <a
            href="https://myaccount.google.com/permissions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 dark:text-primary-400 underline"
          >
            tu cuenta de Google
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">5. Otras plataformas (Twitch, Discord, X, Kick)</h2>
        <p>
          Twitch, Discord, X y Kick se tratan solo para las funciones que actives. Kick usa OAuth 2.1 con PKCE; al
          conectar pueden recibirse webhooks de eventos de livestream. Debes cumplir también los términos de cada
          plataforma.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">6. Cesiones y encargados</h2>
        <p>
          No vendemos tus datos. Podemos compartir información con encargados (hosting, base de datos, correo, pagos —
          p. ej. Railway, Supabase, Resend, Stripe) bajo acuerdos adecuados al RGPD, o cuando exista obligación legal.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">7. Conservación y seguridad</h2>
        <p>
          Medidas técnicas y organizativas razonables (HTTPS, control de acceso, cifrado de tokens de integración cuando
          aplique). Conservamos datos mientras la cuenta esté activa o sea necesario por ley.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">8. Derechos</h2>
        <p>
          Acceso, rectificación, supresión, oposición, limitación y portabilidad. No designamos DPO; el canal de
          privacidad es el correo indicado abajo. Reclamación AEPD: https://www.aepd.es
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">9. Eliminación de cuenta</h2>
        <p>
          Desde Ajustes → Datos de usuario, o por correo a{' '}
          <a href="mailto:privacy@streamautomator.com" className="text-primary-600 dark:text-primary-400 underline">
            privacy@streamautomator.com
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">10. Contacto</h2>
        <p>
          Privacidad:{' '}
          <a href="mailto:privacy@streamautomator.com" className="text-primary-600 dark:text-primary-400 underline">
            privacy@streamautomator.com
          </a>
          {' · '}Legal:{' '}
          <a href="mailto:legal@streamautomator.com" className="text-primary-600 dark:text-primary-400 underline">
            legal@streamautomator.com
          </a>
        </p>
      </section>
    </>
  );
}

function PrivacyEn() {
  return (
    <>
      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">1. Controller</h2>
        <p>
          Dakinis Systems (trading name of Christian David Villar Colodro) is the controller of personal data collected
          through StreamAutomator (&quot;the Service&quot;). This policy explains what we process, why, and your rights under
          GDPR / Spanish LOPDGDD.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">2. Data we collect</h2>
        <ul className="list-disc pl-6 my-2 space-y-1">
          <li><strong>Account data:</strong> username, email, and profile information.</li>
          <li>
            <strong>OAuth data:</strong> access tokens and identifiers from connected platforms (Google, Twitch,
            Discord, YouTube, X, and Kick) needed for publishing, live status, webhooks, and features you enable.
          </li>
          <li>
            <strong>User content:</strong> scheduled posts, events, media, and poll/overlay configuration.
          </li>
          <li>
            <strong>Bot/overlay API key:</strong> authenticates Nightbot-style webhooks and OBS overlays.
          </li>
          <li>
            <strong>Usage and diagnostics:</strong> interactions, technical logs, and security metrics.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">3. Purposes and legal basis</h2>
        <ul className="list-disc pl-6 my-2 space-y-1">
          <li>Provide and perform the service contract (account, authentication, licences).</li>
          <li>Publish or schedule content and receive platform events (including Kick).</li>
          <li>Security, fraud prevention, and technical incidents (legitimate interest).</li>
          <li>Comply with applicable legal obligations.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">4. Google data (login and YouTube)</h2>
        <p>
          If you connect Google for sign-in or YouTube, we use Google APIs in line with the{' '}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 dark:text-primary-400 underline"
          >
            Google API Services User Data Policy
          </a>
          . Minimum scopes: login <code>profile</code>/<code>email</code>; YouTube <code>youtube.upload</code>/
          <code>youtube.readonly</code>. We do not sell Google data. Revoke at{' '}
          <a
            href="https://myaccount.google.com/permissions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 dark:text-primary-400 underline"
          >
            your Google account
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">5. Other platforms (Twitch, Discord, X, Kick)</h2>
        <p>
          Twitch, Discord, X, and Kick are processed only for features you enable. Kick uses OAuth 2.1 with PKCE;
          livestream event webhooks may be received when connected. You must also follow each platform&apos;s terms.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">6. Sharing and processors</h2>
        <p>
          We do not sell your data. We may share information with processors (hosting, database, email, payments — e.g.
          Railway, Supabase, Resend, Stripe) under GDPR-adequate agreements, or when legally required.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">7. Retention and security</h2>
        <p>
          Reasonable technical and organisational measures (HTTPS, access control, encrypted integration tokens where
          applicable). We retain data while your account is active or as required by law.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">8. Your rights</h2>
        <p>
          Access, rectification, erasure, objection, restriction, and portability. We do not appoint a DPO; use the
          privacy email below. Complaints: Spanish AEPD — https://www.aepd.es
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">9. Account deletion</h2>
        <p>
          Settings → User data, or email{' '}
          <a href="mailto:privacy@streamautomator.com" className="text-primary-600 dark:text-primary-400 underline">
            privacy@streamautomator.com
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">10. Contact</h2>
        <p>
          Privacy:{' '}
          <a href="mailto:privacy@streamautomator.com" className="text-primary-600 dark:text-primary-400 underline">
            privacy@streamautomator.com
          </a>
          {' · '}Legal:{' '}
          <a href="mailto:legal@streamautomator.com" className="text-primary-600 dark:text-primary-400 underline">
            legal@streamautomator.com
          </a>
        </p>
      </section>
    </>
  );
}

export default function Privacy() {
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
          {t('privacy.backToApp') || 'Back to app'}
        </Link>

        <h1 className="text-3xl font-bold mb-2">{t('privacy.title') || 'Privacy Policy'}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">{isEn ? UPDATED_EN : UPDATED_ES}</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
          {isEn ? <PrivacyEn /> : <PrivacyEs />}
        </div>

        <Link
          to="/login"
          className="inline-flex items-center gap-2 mt-10 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('privacy.backToApp') || 'Back to app'}
        </Link>
      </div>
      <AppFooter className="mt-12 py-6 px-4 border-t border-accent-light dark:border-gray-700 bg-accent-subtle dark:bg-gray-900 text-center text-gray-500 dark:text-gray-400 text-sm" />
    </div>
  );
}
