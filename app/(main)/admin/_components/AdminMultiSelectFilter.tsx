import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';

export interface AdminMultiSelectOption {
  value: string;
  label: string;
  leading?: string;
}

interface AdminMultiSelectFilterProps {
  label: string;
  allLabel: string;
  selectedValues: string[];
  options: AdminMultiSelectOption[];
  onApply: (values: string[]) => void;
  selectionMode?: 'multiple' | 'single';
  allowAll?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AdminMultiSelectFilter({
  label,
  allLabel,
  selectedValues,
  options,
  onApply,
  selectionMode = 'multiple',
  allowAll = true,
  onOpenChange,
}: AdminMultiSelectFilterProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const [visible, setVisible] = useState(false);
  const [draftValues, setDraftValues] = useState<string[]>([]);
  const animationProgress = useSharedValue(0);
  const afterCloseRef = useRef<(() => void) | null>(null);
  const optionValues = useMemo(() => options.map((option) => option.value), [options]);
  const validSelectedValues = selectedValues.filter((value) => optionValues.includes(value));
  const allSelected = allowAll && (validSelectedValues.length === 0 || validSelectedValues.length === options.length);

  const selectionLabel = useMemo(() => {
    if (allSelected) return allLabel;
    if (validSelectedValues.length === 1) {
      return options.find((option) => option.value === validSelectedValues[0])?.label ?? allLabel;
    }
    return t('admin.v2.selectedCount', { count: validSelectedValues.length });
  }, [allLabel, allSelected, options, t, validSelectedValues]);

  const open = () => {
    setDraftValues(allSelected ? optionValues : validSelectedValues.length ? validSelectedValues : optionValues.slice(0, 1));
    animationProgress.value = 0;
    setVisible(true);
    requestAnimationFrame(() => {
      animationProgress.value = withTiming(1, {
        duration: 240,
        easing: Easing.out(Easing.cubic),
      }, (finished) => {
        if (finished && onOpenChange) runOnJS(onOpenChange)(true);
      });
    });
  };

  const finishClose = () => {
    setVisible(false);
    onOpenChange?.(false);
    const afterClose = afterCloseRef.current;
    afterCloseRef.current = null;
    afterClose?.();
  };

  const close = (afterClose?: () => void) => {
    afterCloseRef.current = afterClose ?? null;
    animationProgress.value = withTiming(0, {
      duration: 180,
      easing: Easing.in(Easing.cubic),
    }, (finished) => {
      if (finished) runOnJS(finishClose)();
    });
  };

  const toggle = (value: string) => {
    if (selectionMode === 'single') {
      setDraftValues([value]);
      return;
    }
    setDraftValues((current) => {
      if (current.includes(value)) {
        return current.length === 1 ? current : current.filter((item) => item !== value);
      }
      return [...current, value];
    });
  };

  const apply = () => {
    const nextValues = allowAll && draftValues.length === options.length ? [] : draftValues;
    close(() => onApply(nextValues));
  };

  const backdropStyle = useAnimatedStyle(() => ({ opacity: animationProgress.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - animationProgress.value) * screenHeight * 0.48 }],
  }));

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selectionLabel}`}
        accessibilityState={{ expanded: visible, disabled: options.length === 0 }}
        disabled={options.length === 0}
        onPress={open}
        style={{
          minHeight: 58,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 14,
          borderWidth: 1,
          borderColor: allSelected ? theme.cardBorder : theme.dataVizPrimary,
          borderRadius: 8,
          backgroundColor: theme.cardBg,
          opacity: options.length === 0 ? 0.5 : 1,
        }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Text className="text-xs font-medium" style={{ color: theme.textSecondary }}>
            {label}
          </Text>
          <Text numberOfLines={1} className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
            {selectionLabel}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
      </Pressable>

      <Modal visible={visible} transparent animationType="none" onRequestClose={() => close()}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Animated.View pointerEvents="none" style={[{ position: 'absolute', inset: 0, backgroundColor: theme.overlayBg }, backdropStyle]} />
          <Pressable
            accessibilityLabel={t('common.close')}
            onPress={() => close()}
            style={{ position: 'absolute', inset: 0 }}
          />
          <Animated.View style={[{ height: '48%' }, sheetStyle]}>
            <View
              style={{
                flex: 1,
                paddingTop: 12,
                paddingBottom: insets.bottom + 16,
                backgroundColor: theme.pageBg,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, minHeight: 52 }}>
                <Text className="flex-1 text-lg font-bold" style={{ color: theme.textPrimary }}>
                  {label}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('common.close')}
                  onPress={() => close()}
                  style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="close" size={24} color={theme.textPrimary} />
                </Pressable>
              </View>

              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
                {options.map((option, index) => {
                  const checked = draftValues.includes(option.value);
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="checkbox"
                      accessibilityLabel={option.label}
                      accessibilityState={{ checked }}
                      onPress={() => toggle(option.value)}
                      style={{
                        minHeight: 54,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        borderTopWidth: index === 0 ? 0 : 1,
                        borderTopColor: theme.cardBorder,
                      }}
                    >
                      <Ionicons
                        name={selectionMode === 'single' ? checked ? 'radio-button-on' : 'radio-button-off' : checked ? 'checkbox' : 'square-outline'}
                        size={23}
                        color={checked ? theme.dataVizPrimary : theme.textSecondary}
                      />
                      {option.leading ? <Text style={{ fontSize: 19 }}>{option.leading}</Text> : null}
                      <Text className="flex-1 text-sm font-semibold" style={{ color: theme.textPrimary }}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 16 }}>
                {allowAll ? <Pressable
                  accessibilityRole="button"
                  onPress={() => setDraftValues(optionValues)}
                  style={{
                    minHeight: 48,
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: theme.cardBorder,
                    borderRadius: 8,
                  }}
                >
                  <Text className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
                    {t('admin.v2.clearFilter')}
                  </Text>
                </Pressable> : null}
                <Pressable
                  accessibilityRole="button"
                  onPress={apply}
                  style={{
                    minHeight: 48,
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    backgroundColor: theme.buttonPrimary,
                  }}
                >
                  <Text className="text-sm font-semibold" style={{ color: theme.buttonPrimaryContrast }}>
                    {t('admin.v2.applyFilters')}
                  </Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}
