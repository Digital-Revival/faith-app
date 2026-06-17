import { Row } from '@/components/common/Row';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps , ReactNode } from 'react';

interface NavigationRowProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  onPress: () => void;
  badge?: string;
  rightElement?: ReactNode;
  disabled?: boolean;
  compact?: boolean;
}

export function NavigationRow(props: NavigationRowProps) {
  return (
    <Row
      variant="navigation"
      icon={props.icon}
      title={props.title}
      subtitle={props.subtitle}
      badge={props.badge}
      rightElement={props.rightElement}
      onPress={props.onPress}
      disabled={props.disabled}
      compact={props.compact}
    />
  );
}
