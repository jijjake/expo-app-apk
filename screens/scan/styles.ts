import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    permissionContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
    },
    permissionContent: {
      alignItems: 'center',
      padding: Spacing['2xl'],
      borderRadius: BorderRadius.xl,
      width: '100%',
    },
    permissionTitle: {
      marginTop: Spacing.xl,
      marginBottom: Spacing.md,
      textAlign: 'center',
    },
    permissionText: {
      textAlign: 'center',
      marginBottom: Spacing.xl,
    },
    permissionButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: Spacing['3xl'],
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
    },
    camera: {
      flex: 1,
    },
    overlay: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    topBar: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    hintBox: {
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    frameContainer: {
      flex: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    frame: {
      width: 280,
      height: 280,
      position: 'relative',
    },
    corner: {
      position: 'absolute',
      width: 40,
      height: 40,
      borderColor: '#FFFFFF',
      borderWidth: 3,
    },
    topLeft: {
      top: 0,
      left: 0,
      borderTopLeftRadius: 8,
      borderBottomRightRadius: 8,
    },
    topRight: {
      top: 0,
      right: 0,
      borderTopRightRadius: 8,
      borderBottomLeftRadius: 8,
    },
    bottomLeft: {
      bottom: 0,
      left: 0,
      borderBottomLeftRadius: 8,
      borderTopRightRadius: 8,
    },
    bottomRight: {
      bottom: 0,
      right: 0,
      borderBottomRightRadius: 8,
      borderTopLeftRadius: 8,
    },
    bottomBar: {
      height: 120,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.lg,
    },
    controlButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    captureButton: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
    },
    captureButtonDisabled: {
      opacity: 0.6,
    },
    captureButtonInner: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.primary,
    },
    processingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    processingBox: {
      padding: Spacing['2xl'],
      borderRadius: BorderRadius.xl,
      alignItems: 'center',
      minWidth: 200,
    },
    processingText: {
      marginTop: Spacing.lg,
    },
  });
};
