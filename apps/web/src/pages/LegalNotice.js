/**
 * Public legal notice page.
 * Includes ownership, contact, and liability information.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import AppFooter from '../components/AppFooter';

function LegalNoticeEs() {
  return (
    <>
      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">1. Titular del sitio</h2>
        <p>
          Este sitio web y la aplicación StreamAutomator son propiedad de Dakinis Systems (nombre comercial de Christian
          David Villar Colodro). NIF: 18513473Z. Domicilio: Málaga, España. Contacto legal:{' '}
          <a href="mailto:legal@streamautomator.com" className="text-primary-600 dark:text-primary-400 underline">
            legal@streamautomator.com
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">2. Objeto</h2>
        <p>
          El presente aviso legal regula el acceso, navegación y uso de la plataforma StreamAutomator, así como las
          responsabilidades derivadas del uso de sus contenidos y servicios.
        </p>
        <p>
          La funcionalidad actual del Servicio incluye, entre otras: planificación y programación de contenido,
          publicación en plataformas conectadas (Google, Twitch, Discord, YouTube, X, Kick), gestión de medios,
          integraciones OAuth, herramientas para stream y paneles de administración.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">3. Condiciones de uso</h2>
        <p>
          El acceso y uso de esta web implica la aceptación de la normativa vigente y de las condiciones publicadas en
          la plataforma, incluyendo los Términos y condiciones y la Política de privacidad.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">4. Propiedad intelectual</h2>
        <p>
          Todo el contenido de la web (textos, diseños, código fuente, logos, imágenes y demás elementos) está protegido
          por la legislación sobre propiedad intelectual e industrial. Queda prohibida su reproducción, distribución o
          modificación sin autorización expresa del titular.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">5. Responsabilidad</h2>
        <p>
          El titular no garantiza la disponibilidad continua del servicio ni la ausencia de errores técnicos, aunque se
          aplican medidas razonables para reducir incidencias y proteger la información. El uso de la plataforma se
          realiza bajo la responsabilidad del usuario.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">6. Enlaces externos</h2>
        <p>
          Esta plataforma puede incluir enlaces a servicios de terceros. StreamAutomator no se responsabiliza del
          contenido, políticas ni prácticas de dichos sitios externos.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">7. Legislación aplicable</h2>
        <p>
          Este aviso legal se rige por la legislación aplicable en materia civil, mercantil y de protección de datos.
          Para cualquier controversia, las partes se someten a los juzgados y tribunales que correspondan conforme a la
          ley.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">8. Contacto</h2>
        <p>
          Para consultas legales o administrativas:{' '}
          <a href="mailto:legal@streamautomator.com" className="text-primary-600 dark:text-primary-400 underline">
            legal@streamautomator.com
          </a>
        </p>
      </section>
    </>
  );
}

function LegalNoticeEn() {
  return (
    <>
      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">1. Site operator</h2>
        <p>
          This website and the StreamAutomator application are owned by Dakinis Systems (trading name of Christian David
          Villar Colodro). Tax ID (NIF): 18513473Z. Address: Malaga, Spain. Legal contact:{' '}
          <a href="mailto:legal@streamautomator.com" className="text-primary-600 dark:text-primary-400 underline">
            legal@streamautomator.com
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">2. Purpose</h2>
        <p>
          This legal notice governs access to, browsing of, and use of the StreamAutomator platform, as well as
          responsibilities arising from use of its content and services.
        </p>
        <p>
          Current features include, among others: content planning and scheduling, publishing to connected platforms
          (Google, Twitch, Discord, YouTube, X, Kick), media management, OAuth integrations, streaming tools, and admin
          panels.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">3. Terms of use</h2>
        <p>
          Access to and use of this site implies acceptance of applicable law and the conditions published on the
          platform, including the Terms and Conditions and the Privacy Policy.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">4. Intellectual property</h2>
        <p>
          All website content (texts, designs, source code, logos, images, and other elements) is protected by
          intellectual and industrial property law. Reproduction, distribution, or modification without the
          operator&apos;s express authorization is prohibited.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">5. Liability</h2>
        <p>
          The operator does not guarantee continuous availability or the absence of technical errors, although
          reasonable measures are applied to reduce incidents and protect information. Use of the platform is at the
          user&apos;s own risk.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">6. External links</h2>
        <p>
          This platform may include links to third-party services. StreamAutomator is not responsible for the content,
          policies, or practices of those external sites.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">7. Governing law</h2>
        <p>
          This legal notice is governed by applicable civil, commercial, and data-protection law. For any dispute, the
          parties submit to the courts that have jurisdiction under the law.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6 mb-2">8. Contact</h2>
        <p>
          For legal or administrative inquiries:{' '}
          <a href="mailto:legal@streamautomator.com" className="text-primary-600 dark:text-primary-400 underline">
            legal@streamautomator.com
          </a>
        </p>
      </section>
    </>
  );
}

export default function LegalNotice() {
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
          {t('legalNotice.backToApp') || 'Back to app'}
        </Link>

        <h1 className="text-3xl font-bold mb-2">{t('legalNotice.title') || 'Legal notice'}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          {t('legalNotice.lastUpdated') ||
            (isEn ? 'Last updated: 4 August 2026' : 'Última actualización: 4 agosto 2026')}
        </p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
          {isEn ? <LegalNoticeEn /> : <LegalNoticeEs />}
        </div>

        <Link
          to="/login"
          className="inline-flex items-center gap-2 mt-10 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('legalNotice.backToApp') || 'Back to app'}
        </Link>
      </div>
      <AppFooter className="mt-12 py-6 px-4 border-t border-accent-light dark:border-gray-700 bg-accent-subtle dark:bg-gray-900 text-center text-gray-500 dark:text-gray-400 text-sm" />
    </div>
  );
}
