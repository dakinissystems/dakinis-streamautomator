/**
 * Public Privacy Policy page.
 * Used for OAuth consent screen and general compliance.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import AppFooter from '../components/AppFooter';

export default function Privacy() {
  const { t } = useLanguage();
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
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Última actualización: 19 de mayo de 2026</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">1. Responsable del tratamiento</h2>
            <p>
              Dakinis Systems es responsable del tratamiento de los datos personales recabados a través de
              StreamAutomator (&quot;el Servicio&quot;). Esta Política de privacidad describe qué datos tratamos, con qué
              finalidad y cuáles son tus derechos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">2. Datos que recopilamos</h2>
            <p>Podemos tratar las siguientes categorías de datos:</p>
            <ul className="list-disc pl-6 my-2 space-y-1">
              <li><strong>Datos de cuenta:</strong> nombre de usuario, correo electrónico e información de perfil.</li>
              <li><strong>Datos OAuth:</strong> tokens de acceso e identificadores técnicos de plataformas conectadas (Google, Twitch, Discord, YouTube, X), necesarios para prestar funcionalidades de publicación.</li>
              <li><strong>Contenido generado:</strong> publicaciones programadas, eventos y archivos multimedia que subes al Servicio.</li>
              <li><strong>Datos de uso y diagnóstico:</strong> interacciones, registros técnicos y métricas para mejorar estabilidad, seguridad y rendimiento.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">3. Finalidades y base jurídica</h2>
            <p>Tratamos tus datos para:</p>
            <ul className="list-disc pl-6 my-2 space-y-1">
              <li>Prestar y ejecutar el contrato de uso del Servicio (gestión de cuenta, autenticación y licencias).</li>
              <li>Publicar o programar contenido en plataformas vinculadas según tu configuración.</li>
              <li>Garantizar seguridad, prevenir fraude y resolver incidencias técnicas (interés legítimo).</li>
              <li>Cumplir obligaciones legales aplicables.</li>
              <li>Enviar comunicaciones esenciales sobre el servicio; las comerciales, solo cuando exista consentimiento o habilitación legal.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">4. Datos de Google (login y YouTube)</h2>
            <p>
              Si conectas Google para iniciar sesión o vincular YouTube, usamos las APIs de Google conforme a la{' '}
              <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 underline">
                Política de datos de usuario de Google API Services
              </a>
              .
            </p>
            <ul className="list-disc pl-6 my-2 space-y-1">
              <li><strong>Login:</strong> perfil y email (scopes mínimos: profile, email).</li>
              <li><strong>YouTube:</strong> solo para publicar o leer metadatos necesarios (scopes: youtube.upload, youtube.readonly).</li>
            </ul>
            <p className="mt-2">
              No vendemos datos de Google ni los usamos para publicidad comportamental. Puedes desconectar Google/YouTube en
              Ajustes de cuenta y revocar el acceso en{' '}
              <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 underline">
                tu cuenta de Google
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">5. Cesiones y encargados de tratamiento</h2>
            <p>
              No vendemos tus datos personales. Podemos compartir información con proveedores que actúan como encargados
              del tratamiento (por ejemplo, infraestructura, base de datos, autenticación o envío de comunicaciones),
              siempre bajo acuerdos de confidencialidad y solo para finalidades propias del Servicio. También podremos
              revelar datos cuando exista obligación legal o requerimiento válido de autoridad competente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">6. Conservación y seguridad</h2>
            <p>
              Aplicamos medidas técnicas y organizativas razonables para proteger los datos frente a accesos no
              autorizados, alteración o pérdida. Conservaremos la información mientras tu cuenta permanezca activa o
              durante el tiempo necesario para cumplir obligaciones legales y atender posibles responsabilidades.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">7. Derechos de las personas usuarias</h2>
            <p>
              Puedes ejercer, cuando resulte aplicable, los derechos de acceso, rectificación, supresión, oposición,
              limitación del tratamiento y portabilidad. También puedes retirar el consentimiento otorgado para
              finalidades concretas. Para ejercer estos derechos, contacta mediante el correo indicado más abajo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">8. Eliminación de cuenta y revocación</h2>
            <p>
              Puedes <strong>eliminar tu cuenta</strong> desde Ajustes → Datos de usuario. También puedes solicitarlo por
              correo a{' '}
              <a href="mailto:privacy@streamautomator.com" className="text-primary-600 dark:text-primary-400 underline">
                privacy@streamautomator.com
              </a>
              . Al eliminar la cuenta, anonimizamos o borramos los datos personales vinculados, salvo lo que debamos
              conservar por ley o seguridad.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-6 mb-2">9. Contacto</h2>
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
