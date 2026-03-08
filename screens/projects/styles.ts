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
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.xl,
      width: '90%',
      maxWidth: 400,
      maxHeight: '85%',
    },
    modalContent: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: Spacing.sm,
    },
    modalBody: {
      gap: Spacing.md,
      maxHeight: 380,
    },
    formGroup: {
      gap: 4,
    },
    label: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.textSecondary,
    },
    input: {
      backgroundColor: theme.backgroundRoot,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderWidth: 1,
      borderColor: theme.border,
      minHeight: 40,
      fontSize: 15,
    },
    textInput: {
      color: theme.textPrimary,
    },
    textArea: {
      minHeight: 60,
      paddingTop: Spacing.sm,
      textAlignVertical: 'top',
    },
    iconSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
    },
    iconOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: BorderRadius.sm,
      backgroundColor: theme.backgroundRoot,
      borderWidth: 1,
      borderColor: theme.border,
    },
    iconOptionSelected: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    iconOptionText: {
      fontSize: 10,
    },
    modalFooter: {
      flexDirection: 'row',
      gap: Spacing.md,
      paddingTop: Spacing.sm,
    },
    modalButton: {
      flex: 1,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      minHeight: 40,
    },
    cancelButton: {
      backgroundColor: theme.backgroundRoot,
      borderWidth: 1,
      borderColor: theme.border,
    },
    confirmButton: {
      backgroundColor: theme.primary,
    },
  });
