import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: theme.backgroundDefault,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.md,
      backgroundColor: theme.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addButton: {
      backgroundColor: theme.primary,
    },
    projectList: {
      flex: 1,
      backgroundColor: theme.backgroundRoot,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: Spacing.md,
      padding: Spacing.xl,
    },
    emptyText: {
      fontSize: 14,
    },
    emptyButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
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
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: theme.backgroundDefault,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.borderLight,
    },
    projectLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: Spacing.sm,
    },
    projectIcon: {
      width: 32,
      textAlign: 'center',
    },
    projectInfo: {
      flex: 1,
    },
    projectName: {
      fontSize: 14,
      fontWeight: '500',
    },
    deleteButton: {
      padding: Spacing.xs,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      width: '100%',
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
    },
    modalContent: {
      backgroundColor: theme.backgroundDefault,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
      paddingBottom: Spacing.xl,
      gap: Spacing.lg,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalBody: {
      maxHeight: '60%',
      gap: Spacing.lg,
    },
    formGroup: {
      gap: Spacing.xs,
    },
    label: {
      fontSize: 12,
      fontWeight: '500',
    },
    input: {
      backgroundColor: theme.backgroundRoot,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      minHeight: 44,
    },
    textInput: {
      fontSize: 16,
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
      gap: Spacing.xs,
    },
    iconOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.md,
      backgroundColor: theme.backgroundRoot,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
    },
    iconOptionSelected: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    modalFooter: {
      flexDirection: 'row',
      gap: Spacing.sm,
      paddingTop: Spacing.sm,
    },
    modalButton: {
      flex: 1,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: theme.backgroundRoot,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '500',
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
};
