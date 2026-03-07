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
    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      backgroundColor: theme.backgroundTertiary,
    },
    dateText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    headerButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
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
    taskList: {
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
    patientCard: {
      backgroundColor: theme.backgroundDefault,
      marginHorizontal: Spacing.md,
      marginTop: Spacing.sm,
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
      ...Platform.select({
        android: {
          elevation: 1,
        },
      }),
    },
    patientHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
    },
    patientInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    bedBadge: {
      backgroundColor: theme.primary,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.sm,
    },
    bedNumber: {
      fontWeight: '600',
    },
    patientHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    tasksContainer: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.borderLight,
      paddingHorizontal: Spacing.md,
    },
    taskItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.borderLight,
    },
    taskLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      flex: 1,
    },
    taskInfo: {
      gap: 2,
    },
    taskName: {
      fontWeight: '500',
    },
    taskRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    timerDisplay: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      minWidth: 60,
    },
    taskActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    editTaskButton: {
      width: 32,
      height: 32,
      borderRadius: BorderRadius.sm,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.backgroundRoot,
    },
    deleteTaskButton: {
      width: 32,
      height: 32,
      borderRadius: BorderRadius.sm,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    timerButtons: {
      flexDirection: 'row',
      gap: 4,
    },
    timerButton: {
      width: 32,
      height: 32,
      borderRadius: BorderRadius.md,
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
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      borderRadius: BorderRadius.sm,
    },
    collectionText: {
      fontSize: 12,
      fontWeight: '600',
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
    projectSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    projectOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.lg,
      backgroundColor: theme.backgroundRoot,
      borderWidth: 1.5,
      borderColor: theme.border,
    },
    projectOptionSelected: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
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
