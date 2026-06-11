import i18n from '../i18n';

export type I18nString = {
  en?: string;
  ar?: string;
};

// Translations for legacy notifications stored as plain English strings in MongoDB.
// New notifications use the {en, ar, fr} object format and don't need this map.
const AR_LEGACY: Record<string, string> = {
  // Titles
  'Welcome to Armada Etijahat!':         'مرحباً بك في Armada Etijahat!',
  'Subscription updated':                'تم تحديث الاشتراك',
  'Subscription cancellation scheduled': 'تم جدولة إلغاء الاشتراك',
  'Welcome to the team!':                'مرحباً بك في الفريق!',
  // Messages
  'Your agency is now on the Pro plan (monthly billing)':
    'وكالتك الآن على الخطة الاحترافية (فوترة شهرية)',
  'Your agency is now on the Medium plan (annual billing)':
    'وكالتك الآن على الخطة المتوسطة (فوترة سنوية)',
  'Your subscription will remain active until Tue May 18 2027 and will not renew':
    'سيبقى اشتراكك نشطاً حتى الثلاثاء 18 مايو 2027 ولن يتجدد تلقائياً',
  'You have been added as a driver for ARAMAX-Agency':
    'تمت إضافتك كسائق في وكالة ARAMAX',
  'Your 14-day free trial has started. Explore all Basic features and upgrade anytime.':
    'بدأت تجربتك المجانية لمدة 14 يوماً. استكشف جميع الميزات الأساسية وقم بالترقية في أي وقت.',
};

// Regex patterns for dynamic legacy strings (developer name, cancellation date, etc.)
function matchArabicPattern(value: string): string | null {
  // "Welcome {name}! We're excited to have you on board..."
  const welcome = value.match(/^Welcome (\w+)!/);
  if (welcome) {
    return `مرحباً ${welcome[1]}! يسعدنا انضمامك إلينا. ابدأ باستكشاف خدماتنا وأخبرنا إن احتجت أي مساعدة.`;
  }
  // "Your subscription will remain active until {date} and will not renew"
  const cancel = value.match(/^Your subscription will remain active until (.+?) and will not renew/);
  if (cancel) {
    return `سيبقى اشتراكك نشطاً حتى ${cancel[1]} ولن يتجدد تلقائياً`;
  }
  return null;
}

export const t18n = (value: I18nString | string | undefined): string => {
  if (!value) return '';

  // New multilingual object — pick the right language directly
  if (typeof value === 'object') {
    const lang = i18n.language as keyof I18nString;
    return value[lang] || value.en || value.ar || '';
  }

  // Plain string in non-Arabic UI — return as-is
  if (i18n.language !== 'ar') return value;

  // Arabic UI: check static map first, then regex patterns, then return original
  return AR_LEGACY[value] ?? matchArabicPattern(value) ?? value;
};
