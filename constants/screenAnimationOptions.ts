export const STACK_ANIMATION = {
  push: "slide_from_right" as const,
  pop: "slide_from_left" as const,
  none: "none" as const,
} as const;

export type StackNavigationScreenOptions = {
  animation?: (typeof STACK_ANIMATION)[keyof typeof STACK_ANIMATION];
  headerShown?: boolean;
  [key: string]: unknown;
};

export function stackScreenOptions(
  overrides?: Partial<StackNavigationScreenOptions>,
): StackNavigationScreenOptions {
  return {
    animation: STACK_ANIMATION.push,
    ...overrides,
  };
}

export function rootScreenOptions(
  overrides?: Partial<StackNavigationScreenOptions>,
): StackNavigationScreenOptions {
  return {
    animation: STACK_ANIMATION.pop,
    ...overrides,
  };
}
