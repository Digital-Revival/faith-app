import { Toggle } from '@/components/ui/Toggle';
import { useBibleschoolSimpleMode } from '@/contexts/BibleschoolSimpleModeContext';
import { useToast } from '@/hooks/useToast';
import { useTranslation } from '@/hooks/useTranslation';
import { bzzt } from '@/utils/haptics';

export function BibleschoolSimpleModeToggle() {
  const toast = useToast();
  const { t } = useTranslation();
  const { enabled, isLoading, setEnabled } = useBibleschoolSimpleMode();

  const handleToggle = async (newValue: boolean) => {
    bzzt();
    try {
      await setEnabled(newValue);
    } catch {
      toast.error(t('common.error'));
    }
  };

  return (
    <Toggle
      value={enabled}
      onValueChange={handleToggle}
      isLoading={isLoading}
      accessibilityLabel={t('settings.simpleMode')}
      accessibilityHint={t('settings.simpleModeAccessibilityHint')}
      accessibilityState={{ checked: enabled }}
    />
  );
}

const __expoRouterPrivateRoute_BibleschoolSimpleModeToggle = () => null;

export default __expoRouterPrivateRoute_BibleschoolSimpleModeToggle;
