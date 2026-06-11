import React from 'react';
import { useTranslation } from 'react-i18next';
import './Footer.scss';

export const Footer: React.FC = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { nameKey: 'footer.links.etaApi', href: '/docs/eta' },
      { nameKey: 'footer.links.distanceApi', href: '/docs/distance' },
{ nameKey: 'footer.links.combinedApi', href: '/docs/combined' },
      { nameKey: 'footer.links.pricing', href: '/pricing' },
      { nameKey: 'footer.links.status', href: '/status' },
    ],
    developers: [
      { nameKey: 'footer.links.documentation', href: '/docs' },
      { nameKey: 'footer.links.apiReference', href: '/api-reference' },
      { nameKey: 'footer.links.support', href: '/support' },
    ],
    company: [
      { nameKey: 'footer.links.about', href: '/about' },
      { nameKey: 'footer.links.blog', href: '/blog' },
      { nameKey: 'footer.links.contact', href: '/contact' },
      { nameKey: 'footer.links.privacyLink', href: '/privacy' },
      { nameKey: 'footer.links.termsLink', href: '/terms' },
    ],
    resources: [
      { nameKey: 'footer.links.helpCenter', href: '/help' },
      { nameKey: 'footer.links.community', href: '/community' },
      { nameKey: 'footer.links.changelog', href: '/changelog' },
    ],
  };

  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__content">
          <div className="footer__brand">
            <div className="footer__logo">
              <div className="footer__logo-icon">🧭</div>
              <span className="footer__logo-text">Etijahat</span>
            </div>
            <p className="footer__description">
              {t('footer.description')}
            </p>
          </div>

          <div className="footer__links">
            <div className="footer__column">
              <h3 className="footer__column-title">{t('footer.product')}</h3>
              <ul className="footer__column-list">
                {footerLinks.product.map((link, index) => (
                  <li key={index}>
                    <a href={link.href} className="footer__link">
                      {t(link.nameKey)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer__column">
              <h3 className="footer__column-title">{t('footer.developers')}</h3>
              <ul className="footer__column-list">
                {footerLinks.developers.map((link, index) => (
                  <li key={index}>
                    <a href={link.href} className="footer__link">
                      {t(link.nameKey)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer__column">
              <h3 className="footer__column-title">{t('footer.company')}</h3>
              <ul className="footer__column-list">
                {footerLinks.company.map((link, index) => (
                  <li key={index}>
                    <a href={link.href} className="footer__link">
                      {t(link.nameKey)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer__column">
              <h3 className="footer__column-title">{t('footer.resources')}</h3>
              <ul className="footer__column-list">
                {footerLinks.resources.map((link, index) => (
                  <li key={index}>
                    <a href={link.href} className="footer__link">
                      {t(link.nameKey)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <div className="footer__bottom-content">
            <p className="footer__copyright">
              © {currentYear} Etijahat. {t('footer.copyright')}
            </p>
            <div className="footer__bottom-links">
              <a href="/privacy" className="footer__bottom-link">{t('footer.privacy')}</a>
              <a href="/terms" className="footer__bottom-link">{t('footer.terms')}</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
