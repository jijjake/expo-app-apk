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
    patientList: {
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
    patientItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: theme.backgroundDefault,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.borderLight,
    },
    patientLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    bedBadge: {
      backgroundColor: theme.primary,
      borderRadius: BorderRadius.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      minWidth: 40,
      alignItems: 'center',
    },
    bedNumber: {
      fontSize: 12,
      fontWeight: '600',
    },
    patientName: {
      fontSize: 15,
      fontWeight: '500',
    },
    patientRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    editButton: {
      width: 32,
      height: 32,
      borderRadius: BorderRadius.sm,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.backgroundTertiary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      padding: Spacing.xl,
    },
    modalContent: {
      width: '100%',
      maxWidth: 400,
    },
    modalBody: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      gap: Spacing.lg,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
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
      fontSize: 16,
      color: theme.textPrimary,
      minHeight: 44,
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
      color: theme.buttonPrimaryText,
    },
  });
};
