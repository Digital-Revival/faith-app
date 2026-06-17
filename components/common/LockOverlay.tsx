import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Box } from '@/components/ui/box';
import { UnlockAnimationOverlay } from '@/components/ui/UnlockAnimationOverlay';
import { useUnlockAnimation } from '@/hooks/useUnlockAnimation';

interface LockOverlayProps {
  isLocked: boolean;
  variant?: 'full' | 'thumbnail';
  renderLockContent?: () => ReactNode;
  style?: StyleProp<ViewStyle>;
}

function DefaultLockContent({ variant }: { variant: 'full' | 'thumbnail' }) {
  const size = variant === 'full' ? 24 : 20;
  return <Ionicons name="lock-closed" size={size} color="#ffffff" />;
}

export function LockOverlay({
  isLocked,
  variant = 'full',
  renderLockContent,
  style,
}: LockOverlayProps) {
  const theme = useTheme();
  const { isAnimating, handleAnimationComplete } = useUnlockAnimation(isLocked);

  if (isAnimating) {
    return (
      <UnlockAnimationOverlay
        visible
        onComplete={handleAnimationComplete}
        style={[
          { borderRadius: variant === 'thumbnail' ? 12 : 16 },
          style,
        ]}
      />
    );
  }

  if (!isLocked) return null;

  return (
    <Box
      className="absolute inset-0 items-center justify-center overflow-hidden"
      style={[
        {
          backgroundColor: theme.overlayBg,
          borderRadius: variant === 'thumbnail' ? 12 : 16,
        },
        style,
      ]}
      pointerEvents="none"
    >
      {renderLockContent ? renderLockContent() : <DefaultLockContent variant={variant} />}
    </Box>
  );
}
