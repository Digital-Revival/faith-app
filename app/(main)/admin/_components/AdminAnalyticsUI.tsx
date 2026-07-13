import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { LayoutChangeEvent, Pressable, ScrollView, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/useTheme';
import type { AdminMetric, AdminPeriod, AdminTrendPoint } from '@/types/analytics';
import { ADMIN_PERIODS, chartScale, metricDelta } from '@/utils/adminAnalytics';

export function AdminCard({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return <View style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder, borderWidth: 1, borderRadius: 8, padding: 16 }}>{children}</View>;
}

export function PeriodSelector({ value, onChange, labels }: { value: AdminPeriod; onChange: (value: AdminPeriod) => void; labels: Record<AdminPeriod, string> }) {
  const theme = useTheme();
  return <View accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: theme.tabInactiveBg, borderRadius: 8, padding: 3 }}>
    {ADMIN_PERIODS.map((period) => {
      const active = period === value;
      return <Pressable key={period} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => onChange(period)} style={{ flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: active ? theme.cardBg : 'transparent' }}>
        <Text className="text-xs font-semibold" style={{ color: active ? theme.textPrimary : theme.textSecondary }}>{labels[period]}</Text>
      </Pressable>;
    })}
  </View>;
}

export function MetricGrid({ metrics, labels }: { metrics: AdminMetric[]; labels: Record<string, string> }) {
  const theme = useTheme();
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
    {metrics.map((metric) => {
      const delta = metricDelta(metric);
      return <View key={metric.id} style={{ width: '48%', flexGrow: 1, minHeight: 112, backgroundColor: theme.cardBg, borderColor: theme.cardBorder, borderWidth: 1, borderRadius: 8, padding: 14 }}>
        <Text className="text-xs font-medium" style={{ color: theme.textSecondary }}>{labels[metric.id] ?? metric.id}</Text>
        <Text className="mt-2 text-2xl font-bold" style={{ color: theme.textPrimary }}>{metric.value}</Text>
        <Text className="mt-1 text-xs font-semibold" style={{ color: delta === null ? theme.textTertiary : delta >= 0 ? theme.dataVizPrimary : theme.dataVizRisk }}>
          {delta === null ? labels.noComparison : `${delta > 0 ? '+' : ''}${delta}% ${labels.previousPeriod}`}
        </Text>
      </View>;
    })}
  </View>;
}

type SeriesKey = 'activeUsers' | 'newUsers' | 'lessonCompletions' | 'moduleCompletions';
export function TrendChart({ points, labels }: { points: AdminTrendPoint[]; labels: Record<string, string> }) {
  const theme = useTheme();
  const [width, setWidth] = useState(300);
  const [series, setSeries] = useState<SeriesKey>('activeUsers');
  const [selected, setSelected] = useState<number | null>(null);
  const [showData, setShowData] = useState(false);
  const height = 150;
  const values = points.map((point) => point[series]);
  const scale = chartScale(values, height - 16);
  const coordinates = points.map((point, index) => ({
    x: points.length <= 1 ? width / 2 : 8 + (index / (points.length - 1)) * (width - 16),
    y: 8 + scale.y(point[series]),
  }));
  const path = coordinates.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  const summary = `${labels[series]}: ${values.reduce((sum, value) => sum + value, 0)}. ${labels.highest}: ${scale.max}.`;
  return <AdminCard>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
      {(['activeUsers','newUsers','lessonCompletions','moduleCompletions'] as SeriesKey[]).map((key) => <Pressable key={key} onPress={() => { setSeries(key); setSelected(null); }} style={{ minHeight: 40, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 6, borderWidth: 1, borderColor: series === key ? theme.dataVizPrimary : theme.cardBorder, backgroundColor: series === key ? `${theme.dataVizPrimary}18` : 'transparent' }}><Text className="text-xs font-semibold" style={{ color: series === key ? theme.dataVizPrimary : theme.textSecondary }}>{labels[key]}</Text></Pressable>)}
    </ScrollView>
    <View accessible accessibilityLabel={summary} onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)} style={{ height: 180 }}>
      <Svg width={width} height={height + 16}>
        {[0, .5, 1].map((ratio) => <Line key={ratio} x1="0" x2={width} y1={8 + ratio * (height - 16)} y2={8 + ratio * (height - 16)} stroke={theme.cardBorder} strokeWidth="1" />)}
        <Path d={path} fill="none" stroke={theme.dataVizPrimary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {coordinates.map((point, index) => <Circle key={index} cx={point.x} cy={point.y} r={selected === index ? 6 : 4} fill={theme.cardBg} stroke={theme.dataVizPrimary} strokeWidth="3" onPress={() => setSelected(index)} />)}
      </Svg>
      {selected !== null && points[selected] ? <View style={{ position: 'absolute', left: 8, bottom: 0, flexDirection: 'row', gap: 8 }}><Text className="text-xs" style={{ color: theme.textSecondary }}>{points[selected].date}</Text><Text className="text-xs font-semibold" style={{ color: theme.textPrimary }}>{points[selected][series]}</Text></View> : null}
    </View>
    <Pressable onPress={() => setShowData((value) => !value)} style={{ minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center' }}><Text className="text-xs font-semibold" style={{ color: theme.dataVizPrimary }}>{showData ? labels.hideData : labels.showData}</Text></Pressable>
    {showData ? <View accessibilityRole="summary">{points.map((point) => <View key={point.date} style={{ minHeight: 36, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: theme.cardBorder }}><Text className="flex-1 text-xs" style={{ color: theme.textSecondary }}>{point.date}</Text><Text className="text-xs font-semibold" style={{ color: theme.textPrimary }}>{point[series]}</Text></View>)}</View> : null}
  </AdminCard>;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const theme = useTheme();
  return <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text className="text-lg font-bold" style={{ color: theme.textPrimary }}>{title}</Text>{action && onAction ? <Pressable onPress={onAction} hitSlop={8} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4 }}><Text className="text-sm font-semibold" style={{ color: theme.dataVizPrimary }}>{action}</Text><Ionicons name="chevron-forward" size={16} color={theme.dataVizPrimary} /></Pressable> : null}</View>;
}
