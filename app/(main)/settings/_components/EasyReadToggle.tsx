import { Toggle } from '@/components/ui/Toggle';
import { useEasyRead } from '@/contexts/EasyReadContext';
import { useToast } from '@/hooks/useToast';
import { useTranslation } from '@/hooks/useTranslation';

export function EasyReadToggle() {
  const toast = useToast();
  const { t } = useTranslation();
  const { enabled, isLoading, setEnabled } = useEasyRead();

  const handleToggle = async (newValue: boolean) => {
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
    />
  );
}

const __expoRouterPrivateRoute_EasyReadToggle = () => null;

export default __expoRouterPrivateRoute_EasyReadToggle;
