import { forwardRef } from 'react';
import { View } from 'react-native';
import { useToast } from '@/hooks/useToast';
import { Ionicons } from '@expo/vector-icons';
import {
  useVideoSetting,
  type VideoQualityPreference,
} from '@/hooks/useVideoSetting';
import {
  SettingsDropdown,
  type SettingsDropdownOption,
  type SettingsDropdownRef,
} from '@/components/ui/SettingsDropdown';

export type VideoQualitySelectorRef = SettingsDropdownRef;

export const VIDEO_QUALITY_OPTIONS: {
  value: VideoQualityPreference;
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: string;
}[] = [
  { value: 'auto', icon: 'phone-portrait', labelKey: 'settings.videoQualityAuto' },
  { value: 'data_saver', icon: 'cellular-outline', labelKey: 'settings.videoQualityDataSaver' },
  { value: 'high', icon: 'desktop', labelKey: 'settings.videoQualityHigh' },
  { value: 'medium', icon: 'tablet-portrait', labelKey: 'settings.videoQualityMedium' },
  { value: 'low', icon: 'resize', labelKey: 'settings.videoQualityLow' },
];

const VIDEO_DROPDOWN_OPTIONS: SettingsDropdownOption<VideoQualityPreference>[] =
  VIDEO_QUALITY_OPTIONS;

interface VideoQualitySelectorProps {
  fullWidth?: boolean;
  measureRef?: React.RefObject<View | null>;
}

function VideoQualitySelectorInner(
  { fullWidth = false, measureRef }: VideoQualitySelectorProps,
  ref: React.ForwardedRef<VideoQualitySelectorRef>,
) {
  const toast = useToast();
  const [value, setValue, isLoading] = useVideoSetting();

  return (
    <SettingsDropdown<VideoQualityPreference>
      ref={ref}
      options={VIDEO_DROPDOWN_OPTIONS}
      value={value}
      onSelect={async (v) => {
        try {
          await setValue(v);
        } catch (err) {
          toast.error('Failed to save. Please try again.');
          throw err;
        }
      }}
      measureRef={measureRef}
      fullWidth={fullWidth}
      isLoading={isLoading}
    />
  );
}

export const VideoQualitySelector = forwardRef(
  VideoQualitySelectorInner,
) as React.ForwardRefExoticComponent<
  VideoQualitySelectorProps & React.RefAttributes<VideoQualitySelectorRef>
>;

const __expoRouterPrivateRoute_VideoQualitySelector = () => null;

export default __expoRouterPrivateRoute_VideoQualitySelector;
