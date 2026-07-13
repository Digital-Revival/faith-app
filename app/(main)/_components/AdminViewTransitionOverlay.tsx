import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import type { AppViewMode } from "@/contexts/AdminViewModeContext";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { Modal, useWindowDimensions } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

const READY_HOLD_MS = 650;
const TRANSITION_DURATION_MS = 1200;
const REDUCED_MOTION_DURATION_MS = 320;

interface AdminViewTransitionOverlayProps {
  visible: boolean;
  targetMode: AppViewMode | null;
  onComplete: () => void;
}

export function AdminViewTransitionOverlay({
  visible,
  targetMode,
  onComplete,
}: AdminViewTransitionOverlayProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);
  const enteringAdmin = targetMode === "admin";

  useEffect(() => {
    if (!visible || !targetMode) return;

    progress.value = 0;
    overlayOpacity.value = 0;
    overlayOpacity.value = withTiming(1, {
      duration: reduceMotion ? 120 : 220,
      easing: Easing.out(Easing.quad),
    });

    const duration = reduceMotion
      ? REDUCED_MOTION_DURATION_MS
      : TRANSITION_DURATION_MS;
    const animation = withTiming(
      1,
      {
        duration,
        easing: Easing.out(Easing.exp),
      },
      (finished) => {
        if (finished) runOnJS(onComplete)();
      },
    );

    progress.value = reduceMotion
      ? animation
      : withDelay(READY_HOLD_MS, animation);

    return () => {
      cancelAnimation(progress);
      cancelAnimation(overlayOpacity);
    };
  }, [onComplete, overlayOpacity, progress, reduceMotion, targetMode, visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const iconStyle = useAnimatedStyle(() => {
    if (reduceMotion) {
      return {
        opacity: interpolate(progress.value, [0, 0.35, 1], [0, 1, 1]),
        transform: [{ scale: interpolate(progress.value, [0, 1], [0.92, 1]) }],
      };
    }

    const translateY = enteringAdmin
      ? interpolate(
          progress.value,
          [0, 0.2, 0.82, 1],
          [height * 0.22, height * 0.12, -height * 0.22, -height * 0.32],
        )
      : interpolate(
          progress.value,
          [0, 0.72, 1],
          [-height * 0.2, -height * 0.03, 0],
        );

    return {
      opacity: 1,
      transform: [
        { translateY },
        {
          scale: interpolate(
            progress.value,
            [0, 0.25, 0.85, 1],
            [0.82, 1, 1.08, 1],
          ),
        },
      ],
    };
  });

  const trailStyle = useAnimatedStyle(() => ({
    opacity:
      enteringAdmin && !reduceMotion
        ? interpolate(progress.value, [0, 0.16, 0.72, 1], [0, 0.9, 0.6, 0])
        : 0,
    transform: [
      {
        scaleY: interpolate(
          progress.value,
          [0, 0.22, 0.72, 1],
          [0.15, 1, 0.72, 0.2],
        ),
      },
    ],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.25, 1], [0, 0.22, 0]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.72, 1.65]) }],
  }));

  const copyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.12, 0.82, 1], [0, 1, 1, 0.72]),
    transform: [
      {
        translateY: reduceMotion
          ? 0
          : interpolate(progress.value, [0, 0.24, 1], [18, 0, -8]),
      },
    ],
  }));

  const transitionLabel = enteringAdmin
    ? t("admin.viewModeEntering")
    : t("admin.viewModeLeaving");

  return (
    <Modal
      visible={visible && Boolean(targetMode)}
      animationType="none"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <Animated.View
        style={[
          {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.pageBg,
          },
          overlayStyle,
        ]}
        accessibilityViewIsModal
        accessibilityLiveRegion="assertive"
        accessibilityLabel={transitionLabel}
      >
        <Text
          className="absolute top-16 text-sm font-semibold"
          style={{ color: theme.textTertiary }}
        >
          Faith Generation
        </Text>

        <Animated.View
          style={[
            {
              width: 104,
              height: 104,
              alignItems: "center",
              justifyContent: "center",
            },
            iconStyle,
          ]}
        >
          <Animated.View
            style={[
              {
                position: "absolute",
                width: 104,
                height: 104,
                borderRadius: 52,
                borderWidth: 2,
                borderColor: theme.buttonPrimary,
              },
              ringStyle,
            ]}
          />
          {enteringAdmin ? (
            <Animated.View
              style={[
                {
                  position: "absolute",
                  top: 74,
                  width: 4,
                  height: 96,
                  borderRadius: 2,
                  backgroundColor: theme.buttonPrimary,
                  transformOrigin: "top",
                },
                trailStyle,
              ]}
            />
          ) : null}
          <Box
            className="w-20 h-20 rounded-full items-center justify-center"
            style={{ backgroundColor: theme.buttonPrimary }}
          >
            <Ionicons
              name={enteringAdmin ? "rocket" : "home"}
              size={38}
              color={theme.buttonPrimaryContrast}
              style={
                enteringAdmin
                  ? { transform: [{ rotate: "-45deg" }] }
                  : undefined
              }
            />
          </Box>
        </Animated.View>

        <Animated.View
          style={[
            {
              position: "absolute",
              left: 32,
              right: 32,
              top: "61%",
              alignItems: "center",
            },
            copyStyle,
          ]}
        >
          <Text
            className="text-2xl font-bold text-center"
            style={{ color: theme.textPrimary }}
          >
            {transitionLabel}
          </Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
