// components/ui/SkeletonCard.tsx — Animated skeleton placeholder for loading states
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface SkeletonCardProps {
  style?: ViewStyle;
  lines?: number;
  hasIcon?: boolean;
  // React's key prop — declared here so TS accepts it in JSX when @types/react isn't installed
  key?: string | number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SkeletonLine({ width, height = 14 }: { width: string | number; height?: number; key?: string | number }) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.line,
        { width, height, backgroundColor: colors.surfaceSubtle, opacity },
      ]}
    />
  );
}

export default function SkeletonCard({ style, lines = 2, hasIcon = true }: SkeletonCardProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }, style]}>
      {hasIcon && (
        <SkeletonLine width={44} height={44} />
      )}
      <View style={styles.content}>
        <SkeletonLine width="70%" height={16} />
        {Array.from({ length: lines - 1 }).map((_, i) => (
          <SkeletonLine key={i} width={`${50 + i * 10}%`} height={13} />
        ))}
      </View>
    </View>
  );
}

export function SkeletonList({ count = 4, hasIcon = true }: { count?: number; hasIcon?: boolean }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} hasIcon={hasIcon} style={{ marginBottom: 8 }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  content: { flex: 1, gap: 8 },
  line: { borderRadius: 6 },
  list: { padding: 16 },
});
