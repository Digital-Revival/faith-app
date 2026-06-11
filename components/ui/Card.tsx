import { forwardRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Box } from '@/components/ui/box';
import { useCardShadow } from '@/hooks/useShadows';
import { useTheme } from '@/hooks/useTheme';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}

export const Card = forwardRef<React.ComponentRef<typeof Box>, CardProps>(
  function Card({ children, className, padding = 'none', style }, ref) {
    const theme = useTheme();
    const cardShadow = useCardShadow();

    const paddingClass =
      padding === 'sm'
        ? 'p-3'
        : padding === 'md'
          ? 'p-4'
          : padding === 'lg'
            ? 'p-5'
            : '';

    return (
      <Box
        ref={ref}
        className={`rounded-2xl overflow-hidden ${paddingClass} ${className ?? ''}`}
        style={[
          {
            backgroundColor: theme.cardBg,
            borderWidth: 1,
            borderColor: theme.cardBorder,
            ...cardShadow,
          },
          style,
        ]}
      >
        {children}
      </Box>
    );
  },
);
