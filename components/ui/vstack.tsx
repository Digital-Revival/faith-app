import { View, ViewProps } from 'react-native';
import { forwardRef } from 'react';

export const VStack = forwardRef<View, ViewProps>((props, ref) => {
  const { className = '', style, ...rest } = props;
  const combinedClassName = `flex-col ${className}`.trim();
  return <View ref={ref} className={combinedClassName} style={style} {...rest} />;
});
VStack.displayName = 'VStack';
