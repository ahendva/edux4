// components/ui/OfflineBanner.tsx — Offline connectivity indicator
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const translateY = useState(new Animated.Value(-60))[0];

  useEffect(() => {
    // Try to import NetInfo; gracefully skip if not installed
    let unsubscribe: (() => void) | null = null;
    try {
      unsubscribe = NetInfo.addEventListener(state => {
        const offline = !state.isConnected;
        setIsOffline(offline);
        Animated.timing(translateY, {
          toValue: offline ? 0 : -60,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    } catch {
      // NetInfo not available
    }
    return () => { unsubscribe?.(); };
  }, []);

  if (!isOffline) return null;

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY }] }]}>
      <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
      <Text style={styles.text}>No internet connection</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#B71C1C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
    zIndex: 999,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
