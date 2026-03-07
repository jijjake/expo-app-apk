import { StyleSheet, Platform } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

export const createStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundRoot,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: theme.backgroundDefault,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.borderLight,
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.backgroundTertiary,
    },
    addButton: {
      backgroundColor: theme.primary,
    },
    projectList: {
      flex: 1,
      paddingHorizontal: Spacing.md,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: Spacing.md,
      paddingVertical: Spacing['5xl'],
    },
    emptyText: {
      fontSize: 14,
      marginTop: Spacing.sm,
    },
    emptyButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
      marginTop: Spacing.md,
    },
    emptyButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    projectItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.backgroundDefault,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      marginTop: Spacing.sm,
      borderRadius: BorderRadius.lg,
      ...Platform.select({
        android: {
          elevation: 1,
        },
      }),
    },
    projectLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      flex: 1,
    },
    projectIconWrapper: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.md,
      backgroundColor: theme.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    projectInfo: {
      flex: 1,
      gap: 2,
    },
    projectName: {
      fontWeight: '500',
    },
    deleteButton: {
      width: 32,
      height: 32,
      borderRadius: BorderRadius.sm,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: theme.backgroundDefault,
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      maxHeight: '90%',
    },
    modalContent: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: Spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.borderLight,
    },
    modalBody: {
      gap: Spacing.lg,
      maxHeight: 400,
    },
    formGroup: {
      gap: Spacing.xs,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    input: {
      backgroundColor: theme.backgroundRoot,
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
      minHeight: 48,
      fontSize: 16,
    },
    textInput: {
      color: theme.textPrimary,
    },
    textArea: {
      minHeight: 88,
      paddingTop: Spacing.sm,
      textAlignVertical: 'top',
    },
    iconSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    iconOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.md,
      backgroundColor: theme.backgroundRoot,
      borderWidth: 1.5,
      borderColor: theme.border,
      minWidth: 80,
    },
    iconOptionSelected: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    iconOptionText: {
      fontSize: 11,
    },
    modalFooter: {
      flexDirection: 'row',
      gap: Spacing.md,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.sm,
    },
    modalButton: {
      flex: 1,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      minHeight: 48,
    },
    cancelButton: {
      backgroundColor: theme.backgroundRoot,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    confirmButton: {
      backgroundColor: theme.primary,
    },
    confirmButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
  });
