import { useEasyRead } from '@/contexts/EasyReadContext';
import { useMemo } from 'react';

export function useBibleschoolEasyReadClasses() {
  const { enabled } = useEasyRead();

  return useMemo(
    () => ({
      body: enabled ? 'text-lg leading-relaxed' : 'text-base',
      title: enabled ? 'text-xl' : 'text-lg',
      caption: enabled ? 'text-sm' : 'text-xs',
    }),
    [enabled],
  );
}
