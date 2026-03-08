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
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: theme.backgroundDefault,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.borderLight,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
    },
    editHeaderButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: theme.backgroundDefault,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.borderLight,
    },
    tab: {
      flex: 1,
      paddingVertical: Spacing.md,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    activeTab: {
      borderBottomColor: theme.primary,
    },
    activeTabText: {
      fontWeight: '600',
    },
    content: {
      flex: 1,
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
    infoSection: {
      padding: Spacing.md,
      gap: Spacing.md,
    },
    infoCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      ...Platform.select({
        android: {
          elevation: 1,
        },
      }),
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
    },
    infoLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    bedBadge: {
      backgroundColor: theme.primary,
      borderRadius: BorderRadius.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
    },
    bedNumber: {
      fontWeight: '600',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.borderLight,
    },
    statsCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      ...Platform.select({
        android: {
          elevation: 1,
        },
      }),
    },
    sectionTitle: {
      marginBottom: Spacing.md,
    },
    statsGrid: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: Spacing.md,
      backgroundColor: theme.backgroundRoot,
      borderRadius: BorderRadius.md,
    },
    historySection: {
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    taskItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.backgroundDefault,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
      ...Platform.select({
        android: {
          elevation: 1,
        },
      }),
    },
    taskLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      flex: 1,
    },
    taskIcon: {
      width: 36,
      height: 36,
      justifyContent: 'center',
      alignItems: 'center',
    },
    taskName: {
      fontWeight: '500',
    },
    statusBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.sm,
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      paddingVertical: Spacing.md,
      marginTop: Spacing.sm,
    },
    logsSection: {
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    logItem: {
      backgroundColor: theme.backgroundDefault,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
      ...Platform.select({
        android: {
          elevation: 1,
        },
      }),
    },
    logLeft: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.sm,
    },
    logIcon: {
      width: 32,
      height: 32,
      borderRadius: BorderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logContent: {
      flex: 1,
      gap: 2,
    },
    logDescription: {
      lineHeight: 20,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.xl,
      width: '90%',
      maxWidth: 400,
    },
    modalBody: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
      gap: Spacing.md,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: Spacing.sm,
    },
    rowInput: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    halfInput: {
      flex: 1,
      gap: 4,
    },
    inputSmall: {
      backgroundColor: theme.backgroundRoot,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderWidth: 1,
      borderColor: theme.border,
      minHeight: 40,
      fontSize: 15,
      color: theme.textPrimary,
    },
    projectSection: {
      gap: Spacing.sm,
    },
    sectionLabel: {
      fontWeight: '500',
    },
    projectGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
    },
    projectChip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.full,
      backgroundColor: theme.backgroundRoot,
      borderWidth: 1,
      borderColor: theme.border,
    },
    projectChipSelected: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    selectedProjects: {
      gap: Spacing.sm,
      paddingTop: Spacing.xs,
    },
    projectEditRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    projectEditName: {
      width: 80,
      fontSize: 13,
    },
    projectEditInputs: {
      flex: 1,
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    timeInput: {
      width: 60,
      backgroundColor: theme.backgroundRoot,
      borderRadius: BorderRadius.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderWidth: 1,
      borderColor: theme.border,
      fontSize: 13,
      color: theme.textPrimary,
      textAlign: 'center',
    },
    notesInput: {
      flex: 1,
      backgroundColor: theme.backgroundRoot,
      borderRadius: BorderRadius.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderWidth: 1,
      borderColor: theme.border,
      fontSize: 13,
      color: theme.textPrimary,
    },
    removeProjectButton: {
      width: 28,
      height: 28,
      borderRadius: BorderRadius.sm,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      paddingVertical: Spacing.xs,
      borderWidth: 1,
      borderColor: theme.border,
      fontSize: 13,
      color: theme.textPrimary,
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
      color: theme.textPrimary,
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
    // 编辑输入框
    editInput: {
      backgroundColor: theme.backgroundRoot,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderWidth: 1,
      borderColor: theme.primary,
      minWidth: 120,
      fontSize: 15,
      color: theme.textPrimary,
    },
    // 治疗项目卡片
    projectsCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      ...Platform.select({
        android: {
          elevation: 1,
        },
      }),
    },
    projectsCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    // 项目列表（查看模式）
    projectsList: {
      gap: Spacing.sm,
    },
    projectItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.backgroundRoot,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
    },
    projectItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    projectItemName: {
      fontWeight: '500',
    },
    projectItemRight: {
      alignItems: 'flex-end',
    },
    projectNotes: {
      marginTop: 2,
    },
    emptyProjects: {
      alignItems: 'center',
      paddingVertical: Spacing.xl,
      gap: Spacing.sm,
    },
    emptyProjectsText: {
      marginTop: Spacing.sm,
    },
    // 可编辑项目列表
    editableProjectsList: {
      gap: Spacing.md,
    },
    editableProjectItem: {
      backgroundColor: theme.backgroundRoot,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    editableProjectHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    projectName: {
      fontWeight: '600',
      flex: 1,
    },
    removeProjectBtn: {
      width: 28,
      height: 28,
      borderRadius: BorderRadius.sm,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    editableProjectInputs: {
      gap: Spacing.sm,
    },
    timeInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    inputIcon: {
      width: 20,
    },
    notesInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    addProjectBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: theme.primary,
      borderStyle: 'dashed',
    },
    addProjectText: {
      fontWeight: '500',
    },
    // 项目选择器区域
    projectSelectorSection: {
      gap: Spacing.sm,
    },
    selectorLabel: {
      marginBottom: Spacing.xs,
    },
    projectGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
    },
    projectChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.full,
      backgroundColor: theme.backgroundRoot,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 4,
    },
    projectChipSelected: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    chipIcon: {
      marginRight: 2,
    },
    chipText: {
      fontSize: 12,
    },
    chipCheck: {
      marginLeft: 2,
    },
    // 已选项目区域
    selectedProjectsSection: {
      gap: Spacing.sm,
    },
    selectedProjectsList: {
      gap: Spacing.md,
    },
    selectedProjectEditItem: {
      backgroundColor: theme.backgroundRoot,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
    },
    selectedProjectHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    selectedProjectName: {
      fontWeight: '600',
      fontSize: 14,
    },
    selectedProjectInputs: {
      flexDirection: 'row',
      gap: Spacing.sm,
      alignItems: 'center',
    },
    timeInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderWidth: 1,
      borderColor: theme.border,
    },
    editTimeInput: {
      width: 50,
      fontSize: 14,
      color: theme.textPrimary,
      textAlign: 'center',
      padding: 0,
    },
    editNotesInput: {
      flex: 1,
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderWidth: 1,
      borderColor: theme.border,
      fontSize: 14,
      color: theme.textPrimary,
    },
    emptySelectedProjects: {
      alignItems: 'center',
      paddingVertical: Spacing.xl,
      gap: Spacing.sm,
    },
    emptySelectedText: {
      textAlign: 'center',
    },
  });
