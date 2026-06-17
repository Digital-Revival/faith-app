import {
  DOTTED_RING_CONTAINER,
  DOTTED_RING_DOT_SIZE,
  getDottedRingDotLayouts,
} from '@/constants/dottedRing';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

export function DottedRingSpinner() {
  const [spin] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 880,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotation = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const dotLayouts = getDottedRingDotLayouts(1);

  return (
    <View style={styles.wrap}>
      <Animated.View
        style={[styles.ring, { transform: [{ rotate: rotation }] }]}
      >
        {dotLayouts.map(({ left, top, opacity }, i) => (
          <View
            key={i}
            style={[styles.dot, { left, top, opacity }]}
          />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: DOTTED_RING_CONTAINER,
    height: DOTTED_RING_CONTAINER,
  },
  ring: {
    width: DOTTED_RING_CONTAINER,
    height: DOTTED_RING_CONTAINER,
  },
  dot: {
    position: 'absolute',
    width: DOTTED_RING_DOT_SIZE,
    height: DOTTED_RING_DOT_SIZE,
    borderRadius: DOTTED_RING_DOT_SIZE / 2,
    backgroundColor: '#FFFFFF',
  },
});
