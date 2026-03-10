// components/ui/LoadingScreen.tsx
import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { styles } from '../../styles';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...'
}) => {
  const { colors } = useTheme();
  const commonStyles = styles.common;
  const themedStyles = styles.createThemedStyles(colors);

  return (
    <View style={[commonStyles.container, commonStyles.center, themedStyles.bgScreen]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[commonStyles.bodyText, themedStyles.textGray, { marginTop: 16 }]}>
        {message}
      </Text>
    </View>
  );
};

export default LoadingScreen;
