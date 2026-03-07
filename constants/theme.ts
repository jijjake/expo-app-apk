export const Colors = {
  light: {
    textPrimary: "#1C1917",
    textSecondary: "#44403c",
    textMuted: "#6B7280",
    primary: "#059669", // Emerald-600 - 健康风格主色
    accent: "#10B981", // Emerald-500 - 辅助色
    success: "#10B981", // Emerald-500
    error: "#EF4444",
    backgroundRoot: "#F8FAFC", // 冷瓷白背景
    backgroundDefault: "#FFFFFF", // 纯白卡片
    backgroundTertiary: "#F0FDF4", // 浅绿背景，用于去线留白
    buttonPrimaryText: "#FFFFFF",
    tabIconSelected: "#059669",
    border: "#D1D5DB",
    borderLight: "#E5E7EB",
  },
  dark: {
    textPrimary: "#FFFFFF",
    textSecondary: "#D1D5DB",
    textMuted: "#9CA3AF",
    primary: "#34D399", // Emerald-400 - 暗色模式健康主色
    accent: "#10B981", // Emerald-500
    success: "#34D399",
    error: "#F87171",
    backgroundRoot: "#0C0A09", // 更深的背景色
    backgroundDefault: "#1C1917",
    backgroundTertiary: "#292524", // 暗色模式去线留白背景
    buttonPrimaryText: "#0C0A09",
    tabIconSelected: "#34D399",
    border: "#52525B",
    borderLight: "#3F3F46",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 64,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 28,
  "4xl": 32,
  full: 9999,
};

export const Typography = {
  display: {
    fontSize: 112,
    lineHeight: 112,
    fontWeight: "200" as const,
    letterSpacing: -4,
  },
  displayLarge: {
    fontSize: 112,
    lineHeight: 112,
    fontWeight: "200" as const,
    letterSpacing: -2,
  },
  displayMedium: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: "200" as const,
  },
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "300" as const,
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  bodyMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500" as const,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  smallMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500" as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
  },
  captionMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500" as const,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500" as const,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
  },
  labelSmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500" as const,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
  },
  labelTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700" as const,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  stat: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "300" as const,
  },
  tiny: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "400" as const,
  },
  navLabel: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "500" as const,
  },
};

export type Theme = typeof Colors.light;
