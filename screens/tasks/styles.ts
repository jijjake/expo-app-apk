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
    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.md,
    },
    dateText: {
      fontSize: 14,
      color: theme.textPrimary,
      fontWeight: '500',
    },
    headerButtons: {
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    iconButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      backgroundColor: theme.backgroundTertiary,
    },
    iconButtonText: {
      fontSize: 12,
      fontWeight: '500',
    },
    addButton: {
      paddingHorizontal: Spacing.md,
    },
    taskList: {
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
    patientCard: {
      backgroundColor: theme.backgroundDefault,
      marginHorizontal: Spacing.sm,
      marginTop: Spacing.sm,
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.borderLight,
    },
    patientHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: theme.backgroundTertiary,
    },
    patientInfo: {
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
    patientHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    tasksContainer: {
      gap: StyleSheet.hairlineWidth,
    },
    taskItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: theme.backgroundDefault,
      gap: Spacing.sm,
    },
    taskLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      flex: 1,
    },
    taskInfo: {
      flex: 1,
      gap: 2,
    },
    taskName: {
      fontSize: 15,
    },
    taskRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    taskActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    editTaskButton: {
      width: 28,
      height: 28,
      borderRadius: BorderRadius.sm,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.backgroundTertiary,
    },
    deleteTaskButton: {
      width: 28,
      height: 28,
      borderRadius: BorderRadius.sm,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    timerDisplay: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.sm,
      minWidth: 60,
      justifyContent: 'center',
    },
    timerButtons: {
      flexDirection: 'row',
      gap: 4,
    },
    timerButton: {
      width: 28,
      height: 28,
      borderRadius: BorderRadius.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    startButton: {
      backgroundColor: theme.primary,
    },
    pauseButton: {
      backgroundColor: '#F59E0B',
    },
    completeButton: {
      backgroundColor: theme.success,
    },
    collectButton: {
      backgroundColor: theme.success,
    },
    collectionPrompt: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      borderRadius: BorderRadius.sm,
    },
    collectionText: {
      fontSize: 12,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
    },
    modalContainer: {
      marginHorizontal: Spacing.md,
    },
    modalContent: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
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
    projectSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
    },
    projectOption: {
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
    projectOptionSelected: {
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
