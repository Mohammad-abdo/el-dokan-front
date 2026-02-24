import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';

export default function LanguageToggle() {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-sm font-medium"
      title={language === 'ar' ? t('common.en') : t('common.ar')}
    >
      <Globe className="w-4 h-4" />
      <span>{language === 'ar' ? 'EN' : 'ع'}</span>
    </button>
  );
}
