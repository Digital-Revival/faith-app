import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import {
  TouchableOpacity,
  Dimensions,
  View,
  Modal,
  TouchableWithoutFeedback,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { bzzt } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsMeasureTarget } from '@/app/(main)/settings/_components/SettingsMeasureTargetContext';

export interface SettingsDropdownOption<T = string> {
  value: T;
  labelKey?: string;
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  flag?: string;
}

export interface SettingsDropdownRef {
  open: () => void;
}

interface SettingsDropdownProps<T> {
  options: SettingsDropdownOption<T>[];
  value: T;
  onSelect: (value: T) => Promise<void>;
  accessibilityLabel?: string;
  measureRef?: React.RefObject<View | null>;
  fullWidth?: boolean;
  isLoading?: boolean;
  variant?: 'default' | 'inline';
  dropdownWidth?: 'full' | 'matchTrigger';
  showTriggerLabel?: boolean;
}

function SettingsDropdownInner<T extends string>(
  {
    options,
    value,
    onSelect,
    accessibilityLabel,
    measureRef,
    fullWidth = false,
    isLoading = false,
    variant = 'default',
    dropdownWidth = 'full',
    showTriggerLabel = true,
  }: SettingsDropdownProps<T>,
  ref: React.ForwardedRef<SettingsDropdownRef>,
) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [layout, setLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const contextGetMeasureTarget = useSettingsMeasureTarget();
  const triggerRef = useRef<View>(null);
  const isDark = theme.isDark;
  const { width: screenWidth } = Dimensions.get('window');
  const selectedOption = options.find((o) => o.value === value) ?? options[0];
  const displayLabel = selectedOption.label ?? (selectedOption.labelKey ? t(selectedOption.labelKey) : '');
  const isInline = variant === 'inline';
  const triggerCompact =
    isInline && !showTriggerLabel && Boolean(selectedOption.flag);
  const inlineMenuWidth = Math.min(screenWidth - 96, 160);
  const compactMatchTriggerMenuWidth = Math.min(screenWidth - 32, 280);
  const switcherWidth = isInline
    ? triggerCompact
      ? Math.min(screenWidth - 96, 72)
      : inlineMenuWidth
    : fullWidth
      ? undefined
      : Math.min(screenWidth - 96, 320);

  const containerStyle: ViewStyle = fullWidth
    ? { flex: 1, alignSelf: 'stretch' }
    : { width: switcherWidth, minWidth: switcherWidth };

  const handleOpen = useCallback(() => {
    bzzt();
    const target =
      contextGetMeasureTarget?.() ?? measureRef?.current ?? triggerRef.current;
    target?.measureInWindow((x, y, width, height) => {
      setLayout({ x, y, width, height: height ?? 0 });
      setExpanded(true);
    });
  }, [contextGetMeasureTarget, measureRef]);

  useImperativeHandle(ref, () => ({ open: handleOpen }), [handleOpen]);

  const handleClose = () => {
    setExpanded(false);
    setLayout(null);
  };

  const handleSelect = async (newValue: T) => {
    bzzt();
    try {
      await onSelect(newValue);
      handleClose();
    } catch {
    }
  };

  const triggerStyle: ViewStyle = isInline
    ? {
        width: '100%' as const,
        paddingHorizontal: triggerCompact ? 10 : 12,
        paddingVertical: 10,
      }
    : {
        width: '100%' as const,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: theme.cardBg,
        borderWidth: 1,
        borderColor: theme.cardBorder,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.2 : 0.05,
        shadowRadius: 4,
        elevation: 2,
      };

  return (
    <View ref={triggerRef} style={containerStyle} collapsable={false}>
      <TouchableOpacity
        onPress={handleOpen}
        activeOpacity={0.7}
        style={triggerStyle}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? displayLabel}
        accessibilityState={{ expanded, disabled: isLoading }}
      >
        <HStack
          className={`items-center gap-2 ${triggerCompact ? 'w-full justify-between' : ''}`}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={theme.brandAccent} />
          ) : selectedOption.flag ? (
            <Text style={{ fontSize: 18 }}>{selectedOption.flag}</Text>
          ) : selectedOption.icon ? (
            <Ionicons
              name={selectedOption.icon as keyof typeof Ionicons.glyphMap}
              size={20}
              color={theme.textPrimary}
            />
          ) : null}
          {(!selectedOption.flag || showTriggerLabel) && (
            <Text
              className="text-sm font-semibold flex-1"
              style={{ color: theme.textPrimary }}
            >
              {displayLabel}
            </Text>
          )}
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={theme.textSecondary}
          />
        </HStack>
      </TouchableOpacity>

      <Modal
        visible={expanded}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <View style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={handleClose}>
            <View style={{ flex: 1 }} />
          </TouchableWithoutFeedback>
          {layout && (
            <View
              style={{
                position: 'absolute',
                ...(dropdownWidth === 'matchTrigger'
                  ? triggerCompact
                    ? {
                        width: compactMatchTriggerMenuWidth,
                        left: Math.max(
                          16,
                          Math.min(
                            layout.x +
                              layout.width -
                              compactMatchTriggerMenuWidth,
                            screenWidth - 16 - compactMatchTriggerMenuWidth,
                          ),
                        ),
                      }
                    : { left: layout.x, width: layout.width }
                  : { left: 24, right: 24 }),
                top: layout.y + layout.height + 4,
                zIndex: 9999,
              }}
            >
              <View
                style={{
                  borderRadius: 12,
                  overflow: 'hidden',
                  backgroundColor: theme.cardBg,
                  borderWidth: 1,
                  borderColor: theme.cardBorder,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isDark ? 0.25 : 0.1,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                {options.map((opt, index) => {
                  const isSelected = value === opt.value;
                  const itemLabel = opt.label ?? (opt.labelKey ? t(opt.labelKey) : '');
                  return (
                    <TouchableOpacity
                      key={String(opt.value)}
                      onPress={() => handleSelect(opt.value)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={itemLabel}
                      accessibilityState={{ selected: isSelected }}
                      style={{
                        paddingVertical: opt.flag ? 12 : 18,
                        paddingHorizontal: opt.flag ? 14 : 20,
                        backgroundColor: isSelected
                          ? isDark
                            ? 'rgba(23, 23, 23, 0.3)'
                            : 'rgba(23, 23, 23, 0.06)'
                          : 'transparent',
                        borderTopWidth: index > 0 ? 1 : 0,
                        borderTopColor: theme.cardBorder,
                      }}
                    >
                      <HStack className={`items-center ${opt.flag ? 'gap-2' : 'gap-3'}`}>
                        {opt.flag ? (
                          <Text style={{ fontSize: 18 }}>{opt.flag}</Text>
                        ) : opt.icon ? (
                          <Ionicons
                            name={(() => {
                              const isOutlineIcon = opt.icon.endsWith('-outline');
                              const base = isOutlineIcon
                                ? (opt.icon.slice(0, -8) as keyof typeof Ionicons.glyphMap)
                                : opt.icon;
                              return isSelected
                                ? base
                                : (isOutlineIcon
                                    ? opt.icon
                                    : `${opt.icon}-outline`) as keyof typeof Ionicons.glyphMap;
                            })()}
                            size={22}
                            color={
                              isSelected
                                ? theme.buttonPrimary
                                : theme.textSecondary
                            }
                          />
                        ) : null}
                        <Text
                          className={`flex-1 ${opt.flag ? 'text-sm font-semibold' : 'text-base font-medium'}`}
                          style={{ color: theme.textPrimary }}
                        >
                          {itemLabel}
                        </Text>
                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={opt.flag ? 20 : 22}
                            color={theme.buttonPrimary}
                          />
                        )}
                      </HStack>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

export const SettingsDropdown = forwardRef(SettingsDropdownInner) as <T extends string>(
  props: SettingsDropdownProps<T> & { ref?: React.ForwardedRef<SettingsDropdownRef> }
) => React.ReactElement;
