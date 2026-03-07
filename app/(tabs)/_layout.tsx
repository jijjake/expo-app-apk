import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

export default function TabLayout() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.backgroundRoot,
          borderTopColor: theme.border,
          // 移动端：标准高度 50px + 底部安全区
          // Web端：固定60px，无需安全区
          height: Platform.OS === 'web' ? 60 : 50 + insets.bottom,
          // 移动端：内容区域底部 padding 防止内容被遮挡
          paddingBottom: Platform.OS === 'web' ? 0 : insets.bottom,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarItemStyle: {
          // **Web 兼容性强制规范**：Web 端必须显式指定 item 高度，防止 Tab Bar 高度塌陷或图标显示异常
          height: Platform.OS === 'web' ? 60 : undefined,
        },
      }}
    >
      {/* name 必须与文件名完全一致 */}
      <Tabs.Screen
        name="index"
        options={{
          title: '任务',
          tabBarIcon: ({ color }) => <FontAwesome6 name="clipboard-list" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: '病人',
          tabBarIcon: ({ color }) => <FontAwesome6 name="users" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: '项目',
          tabBarIcon: ({ color }) => <FontAwesome6 name="folder-open" size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}
