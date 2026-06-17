import { createContext, useContext } from 'react';
import type { View } from 'react-native';

type MeasureTargetGetter = () => View | null;

export const SettingsMeasureTargetContext =
  createContext<MeasureTargetGetter | null>(null);

export function useSettingsMeasureTarget(): MeasureTargetGetter | null {
  return useContext(SettingsMeasureTargetContext);
}
