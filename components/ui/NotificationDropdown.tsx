import { DropdownShell } from '@/components/ui/DropdownShell';
import { Text } from '@/components/ui/text';
import { routes } from '@/constants/routes';
import { useTheme } from '@/hooks/useTheme';
import { useNotifications } from '@/hooks/useNotifications';
import { useTranslation } from '@/hooks/useTranslation';
import { formatRelativeDate } from '@/utils/formatters';
import { bzzt } from '@/utils/haptics';
import { DrawerActions, useNavigation } from "expo-router/react-navigation";
import { Ionicons } from '@expo/vector-icons';
import { type Href, router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import type { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import type { UserNotification } from '@/types/notification';

const CLOSE_ANIMATION_MS = 250;
const ACTION_WIDTH = 72;

const DROPDOWN_WIDTH = 300;
const DROPDOWN_MAX_HEIGHT = 320;
const DROPDOWN_GAP = 8;
const RIGHT_PADDING = 16;

function RightActions({
  translation,
  theme,
  onDelete,
}: {
  translation: SharedValue<number>;
  theme: ReturnType<typeof useTheme>;
  onDelete: () => void;
}) {
  const containerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translation.value,
      [-ACTION_WIDTH, -ACTION_WIDTH * 0.4, -ACTION_WIDTH * 0.1, 0],
      [1, 0.6, 0.15, 0],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  const iconStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      translation.value,
      [-ACTION_WIDTH, -ACTION_WIDTH * 0.3, 0],
      [1, 0.5, 0],
      Extrapolation.CLAMP,
    );
    return { transform: [{ scale }] };
  });

  return (
    <Animated.View
      style={[
        {
          backgroundColor: theme.buttonDecline,
          width: ACTION_WIDTH,
          justifyContent: 'center',
          alignItems: 'center',
        },
        containerStyle,
      ]}
    >
      <RectButton
        onPress={onDelete}
        style={{
          flex: 1,
          width: '100%',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Animated.View style={iconStyle}>
          <Ionicons name="trash-outline" size={22} color={theme.buttonDeclineContrast} />
        </Animated.View>
      </RectButton>
    </Animated.View>
  );
}

function NotificationItem({
  notification,
  onPress,
  onRemove,
  onSwipeableWillOpen,
  onSwipeableClose,
  theme,
}: {
  notification: UserNotification;
  onPress: () => void;
  onRemove: () => void;
  onSwipeableWillOpen: (ref: SwipeableMethods | null) => void;
  onSwipeableClose: (ref: SwipeableMethods | null) => void;
  theme: ReturnType<typeof useTheme>;
}) {
  const { t } = useTranslation();
  const swipeableRef = useRef<SwipeableMethods>(null);
  const isBadgeEarned = notification.type === 'badge_earned';
  const data = notification.data;

  const handleDelete = useCallback(() => {
    bzzt();
    swipeableRef.current?.close();
    setTimeout(() => onRemove(), CLOSE_ANIMATION_MS);
  }, [onRemove]);

  if (!isBadgeEarned || !data) return null;

  const badgeName = t(data.name_key as never as string, {
    count: data.target_value ?? 0,
    module: data.target_value ?? 0,
  });

  const renderRightActions = useCallback(
    (_progress: SharedValue<number>, translation: SharedValue<number>) => (
      <RightActions translation={translation} theme={theme} onDelete={handleDelete} />
    ),
    [theme, handleDelete],
  );

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      friction={1.5}
      rightThreshold={ACTION_WIDTH * 0.3}
      overshootFriction={10}
      onSwipeableWillOpen={() => onSwipeableWillOpen(swipeableRef.current)}
      onSwipeableClose={() => onSwipeableClose(swipeableRef.current)}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className="flex-row items-center gap-3 py-3 px-4 cursor-pointer"
        style={{
          borderBottomWidth: 1,
          borderBottomColor: theme.cardBorder,
          backgroundColor: notification.read_at ? undefined : theme.badgeSuccessBg,
        }}
      >
        <View
          className="rounded-full w-10 h-10 items-center justify-center"
          style={{ backgroundColor: theme.badgeSuccess }}
        >
          <Ionicons
            name={data.icon as keyof typeof Ionicons.glyphMap}
            size={20}
            color={theme.textPrimary}
          />
        </View>
        <View className="flex-1">
          <Text
            className="text-sm font-medium"
            style={{ color: theme.textPrimary }}
            numberOfLines={1}
          >
            {t('notifications.badgeEarned', { name: badgeName })}
          </Text>
          <Text
            className="text-xs mt-0.5"
            style={{ color: theme.textTertiary }}
          >
            {formatRelativeDate(notification.created_at)}
          </Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

export function NotificationDropdown() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAllAsRead,
    markAsRead,
    isMarkingAllAsRead,
    remove,
    removeAll,
    isRemovingAll,
  } = useNotifications();
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const buttonRef = useRef<View>(null);
  const openSwipeableRef = useRef<SwipeableMethods | null>(null);

  const handleSwipeableWillOpen = useCallback((ref: SwipeableMethods | null) => {
    if (openSwipeableRef.current && openSwipeableRef.current !== ref) {
      openSwipeableRef.current.reset();
    }
    openSwipeableRef.current = ref;
  }, []);

  const handleSwipeableClose = useCallback((ref: SwipeableMethods | null) => {
    if (!ref) return;
    if (openSwipeableRef.current === ref) {
      openSwipeableRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (notifications.length === 0) {
      openSwipeableRef.current = null;
    }
  }, [notifications.length]);

  const open = () => {
    bzzt();
    buttonRef.current?.measureInWindow((_x, y, _width, height) => {
      const { width: screenWidth } = Dimensions.get('window');
      setPosition({
        left: screenWidth - DROPDOWN_WIDTH - RIGHT_PADDING,
        top: y + (height ?? 0) + DROPDOWN_GAP,
        width: DROPDOWN_WIDTH,
        maxHeight: DROPDOWN_MAX_HEIGHT,
      });
      setVisible(true);
    });
  };

  const close = () => {
    setVisible(false);
    setPosition(null);
  };

  const handleNotificationPress = (notification: UserNotification) => {
    bzzt();
    if (!notification.read_at) {
      markAsRead(notification.id);
    }
    close();
    const data = notification.type === 'badge_earned' ? notification.data : null;
    const href = routes.badges(data?.badge_id);
    router.replace(href as Href);
    navigation.dispatch(DrawerActions.closeDrawer());
  };

  const handleMarkAllAsSeen = () => {
    bzzt();
    markAllAsRead();
  };

  return (
    <>
      <View ref={buttonRef} collapsable={false} className="relative">
        <TouchableOpacity
          onPress={open}
          activeOpacity={0.7}
          className="cursor-pointer items-center justify-center"
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 10,
            backgroundColor: theme.cardBg,
            borderWidth: 1,
            borderColor: theme.cardBorder,
          }}
        >
          <Ionicons
            name="notifications-outline"
            size={20}
            color={theme.textPrimary}
          />
          {unreadCount > 0 && (
            <View
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full items-center justify-center px-1"
              style={{
                backgroundColor: theme.badgeError,
              }}
            >
              <Text
                className="text-xs font-bold"
                style={{ color: theme.buttonDeclineContrast }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <DropdownShell visible={visible} onClose={close} position={position}>
        <ScrollView
          style={{ maxHeight: DROPDOWN_MAX_HEIGHT }}
          showsVerticalScrollIndicator={true}
        >
          {isLoading ? (
            <View className="py-10 px-6 items-center">
              <Text
                className="text-sm"
                style={{ color: theme.textSecondary }}
              >
                {t('common.loading')}
              </Text>
            </View>
          ) : notifications.length === 0 ? (
            <View className="py-10 px-6 items-center">
              <Ionicons
                name="notifications-off-outline"
                size={40}
                color={theme.textTertiary}
              />
              <Text
                className="text-base mt-3"
                style={{ color: theme.textSecondary }}
              >
                {t('notifications.empty')}
              </Text>
            </View>
          ) : (
            <>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onPress={() => handleNotificationPress(notification)}
                  onRemove={() => remove(notification.id)}
                  onSwipeableWillOpen={handleSwipeableWillOpen}
                  onSwipeableClose={handleSwipeableClose}
                  theme={theme}
                />
              ))}
              {unreadCount > 0 && (
                <TouchableOpacity
                  onPress={handleMarkAllAsSeen}
                  disabled={isMarkingAllAsRead}
                  activeOpacity={0.7}
                  className="py-3 px-4 items-center cursor-pointer"
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: theme.cardBorder,
                    backgroundColor: theme.cardBg,
                  }}
                >
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: theme.buttonPrimary }}
                  >
                    {t('notifications.markAllAsSeen')}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => {
                  bzzt();
                  Alert.alert(
                    t('notifications.removeAllConfirmTitle'),
                    t('notifications.removeAllConfirmMessage'),
                    [
                      { text: t('common.cancel'), style: 'cancel' },
                      {
                        text: t('common.confirm'),
                        style: 'destructive',
                        onPress: () => removeAll(),
                      },
                    ],
                  );
                }}
                disabled={isRemovingAll}
                activeOpacity={0.7}
                className="py-3 px-4 items-center cursor-pointer"
                style={{
                  borderTopWidth: 1,
                  borderTopColor: theme.cardBorder,
                  backgroundColor: theme.cardBg,
                }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: theme.buttonDecline }}
                >
                  {t('notifications.removeAll')}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </DropdownShell>
    </>
  );
}
