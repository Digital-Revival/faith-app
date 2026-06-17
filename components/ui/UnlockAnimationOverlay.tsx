import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { Box } from './box';

const LOCK_PHASE_MS = 500;
const UNLOCK_ROTATE_MS = 700;
const UNLOCK_OPEN_MS = 500;
const FADE_OUT_DELAY_MS = 300;

interface UnlockAnimationOverlayProps {
  visible: boolean;
  onComplete?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function UnlockAnimationOverlay({
  visible,
  onComplete,
  style,
}: UnlockAnimationOverlayProps) {
  const theme = useTheme();
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const overlayOpacity = useSharedValue(1);
  const showOpen = useSharedValue(0);

  useEffect(() => {
    if (!visible || !onComplete) return;

    const complete = () => onComplete();

    rotation.value = 0;
    scale.value = 1;
    overlayOpacity.value = 1;
    showOpen.value = 0;

    rotation.value = withSequence(
      withDelay(
        LOCK_PHASE_MS,
        withSpring(-45, { damping: 15, stiffness: 120 })
      ),
      withSpring(0, { damping: 15, stiffness: 120 })
    );

    scale.value = withSequence(
      withDelay(
        LOCK_PHASE_MS,
        withSpring(1.2, { damping: 12, stiffness: 100 })
      ),
      withSpring(1, { damping: 12, stiffness: 100 })
    );

    showOpen.value = withDelay(
      LOCK_PHASE_MS + UNLOCK_ROTATE_MS,
      withSpring(1, { damping: 18, stiffness: 90 })
    );

    overlayOpacity.value = withDelay(
      LOCK_PHASE_MS + UNLOCK_ROTATE_MS + UNLOCK_OPEN_MS + FADE_OUT_DELAY_MS,
      withSpring(0, { damping: 20, stiffness: 80 }, (finished) => {
        if (finished) runOnJS(complete)();
      })
    );
  }, [visible, onComplete, rotation, scale, overlayOpacity, showOpen]);

  const lockedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
    opacity: 1 - showOpen.value,
  }));

  const openStyle = useAnimatedStyle(() => ({
    opacity: showOpen.value,
    transform: [{ scale: scale.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      style={[
        {
          position: 'absolute',
          inset: 0,
          backgroundColor: theme.overlayBg,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
          overflow: 'hidden',
        },
        style,
        overlayStyle,
      ]}
      pointerEvents="none"
    >
      <Box style={{ width: 80, height: 80, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={[{ position: 'absolute' }, lockedStyle]}>
          <Ionicons name="lock-closed" size={44} color="#ffffff" />
        </Animated.View>
        <Animated.View style={[{ position: 'absolute' }, openStyle]}>
          <Ionicons name="lock-open" size={44} color="#ffffff" />
        </Animated.View>
      </Box>
    </Animated.View>
  );
}
