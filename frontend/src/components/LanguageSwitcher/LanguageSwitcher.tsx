import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.scss';

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'ar', label: 'AR' },
] as const;

type LangCode = (typeof LANGS)[number]['code'];

interface Props {
  variant?: 'dark' | 'light';
}

const GlobeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const LanguageSwitcher: React.FC<Props> = ({ variant = 'light' }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentCode = (LANGS.find(l => l.code === i18n.language)?.code ?? 'en') as LangCode;

  const switchTo = (code: LangCode) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className={`lang-switcher lang-switcher--${variant}`}>
      <button
        type="button"
        className="lang-switcher__btn"
        onClick={() => setIsOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Switch language"
      >
        <GlobeIcon />
        <span className="lang-switcher__badge">{currentCode.toUpperCase()}</span>
      </button>

      {isOpen && (
        <>
          <div className="lang-switcher__backdrop" onClick={() => setIsOpen(false)} />
          <ul className="lang-switcher__dropdown" role="listbox" aria-label="Languages">
            {LANGS.map(lang => (
              <li key={lang.code} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={lang.code === currentCode}
                  className={`lang-switcher__option ${lang.code === currentCode ? 'lang-switcher__option--active' : ''}`}
                  onClick={() => switchTo(lang.code)}
                >
                  {lang.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;
