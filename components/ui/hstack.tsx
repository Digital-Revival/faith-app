import { View, ViewProps } from 'react-native';
import { forwardRef } from 'react';

export const HStack = forwardRef<View, ViewProps>((props, ref) => {
  const { className = '', style, ...rest } = props;
  const combinedClassName = `flex-row ${className}`.trim();
  return <View ref={ref} className={combinedClassName} style={style} {...rest} />;
});
HStack.displayName = 'HStack';
