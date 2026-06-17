import { BadgePill } from '@/components/ui/BadgePill';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps , ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';

type RowVariant = 'navigation' | 'setting';

interface RowBaseProps {
  variant: RowVariant;
  icon: ComponentProps<typeof Ionicons>['name'];
  iconColor?: string;
  compact?: boolean;
}

interface RowNavigationProps extends RowBaseProps {
  variant: 'navigation';
  title: string;
  subtitle?: string;
  badge?: string;
  rightElement?: ReactNode;
  onPress: () => void;
  disabled?: boolean;
}

interface RowSettingProps extends RowBaseProps {
  variant: 'setting';
  labelKey: string;
  descriptionKey?: string;
  value?: ReactNode;
  children?: ReactNode;
  fullWidthChildren?: boolean;
}

type RowProps = RowNavigationProps | RowSettingProps;

export function Row(props: RowProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const iconColor = props.iconColor ?? theme.textPrimary;
  const isCompact = props.compact ?? false;

  const iconSize = props.variant === 'setting' ? 22 : isCompact ? 22 : 28;
  const iconBoxClass = props.variant === 'setting' ? 'rounded-xl p-3' : isCompact ? 'rounded-lg p-2' : 'rounded-xl p-3';

  const content = (
    <HStack
      className={
        props.variant === 'setting'
          ? 'items-center justify-between px-5 py-4'
          : isCompact
            ? 'items-center gap-4'
            : 'items-center gap-4'
      }
      style={props.variant === 'setting' ? { minHeight: 56 } : undefined}
    >
      <HStack className={`items-center gap-4 ${props.variant === 'setting' ? 'flex-1 min-w-0' : 'flex-1'}`}>
        <Box className={iconBoxClass} style={{ backgroundColor: theme.avatarPrimary }}>
          <Ionicons name={props.icon} size={iconSize} color={props.variant === 'setting' ? iconColor : theme.textPrimary} />
        </Box>
        <VStack className="flex-1 min-w-0">
          {props.variant === 'navigation' ? (
            <>
              <Text
                className={isCompact ? 'text-base font-semibold' : 'text-lg font-bold'}
                style={{ color: theme.textPrimary }}
              >
                {props.title}
              </Text>
              {props.subtitle ? (
                <Text
                  className={isCompact ? 'text-xs' : 'text-sm'}
                  style={{ color: theme.textSecondary, marginTop: isCompact ? 1 : 2 }}
                  numberOfLines={1}
                >
                  {props.subtitle}
                </Text>
              ) : null}
            </>
          ) : (
            <>
              <Text
                className="text-sm font-medium"
                style={{ color: theme.textPrimary }}
                numberOfLines={1}
              >
                {t(props.labelKey)}
              </Text>
              {props.descriptionKey ? (
                <Text
                  className="text-xs mt-0.5"
                  style={{ color: theme.textSecondary }}
                  numberOfLines={1}
                >
                  {t(props.descriptionKey)}
                </Text>
              ) : null}
            </>
          )}
        </VStack>
      </HStack>
      {props.variant === 'navigation' ? (
        <>
          {props.badge ? <BadgePill label={props.badge} /> : null}
          {props.rightElement ??
            (props.disabled ? null : (
              <Ionicons name="chevron-forward" size={isCompact ? 18 : 20} color={theme.textTertiary} />
            ))}
        </>
      ) : (
        props.children ? (
          <Box
            className="ml-3"
            style={props.fullWidthChildren ? { flex: 1, minWidth: 0 } : { flexShrink: 0 }}
          >
            {props.children}
          </Box>
        ) : (
          props.value !== undefined && (
            <Box className="ml-3" style={{ flexShrink: 0 }}>
              {props.value}
            </Box>
          )
        )
      )}
    </HStack>
  );

  if (props.variant === 'navigation') {
    return (
      <TouchableOpacity
        onPress={props.disabled ? undefined : props.onPress}
        activeOpacity={0.7}
        className="cursor-pointer"
        disabled={props.disabled}
        style={props.disabled ? { opacity: 0.5 } : undefined}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}
