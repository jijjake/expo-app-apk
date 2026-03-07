import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { createStyles } from './styles';
import { createFormDataFile } from '@/utils';

interface OCRResult {
  patients: Array<{
    name: string;
    bedNumber: string;
    treatments: Array<{
      name: string;
      duration: number;
    }>;
  }>;
}

export default function ScanScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleCameraFacing = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }, []);

  const takePicture = useCallback(async () => {
    if (!cameraRef.current || isProcessing) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsProcessing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (!photo?.uri) {
        throw new Error('Failed to take picture');
      }

      // 上传图片到后端进行 OCR 识别
      await uploadAndRecognize(photo.uri);
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('错误', '拍照失败，请重试');
      setIsProcessing(false);
    }
  }, [isProcessing]);

  const uploadAndRecognize = async (imageUri: string) => {
    try {
      // 使用 FormData 上传图片
      const formData = new FormData();

      const file = await createFormDataFile(imageUri, 'treatment-table.jpg', 'image/jpeg');
      formData.append('file', file as any);

      /**
       * 服务端文件：server/src/routes/ocr.ts
       * 接口：POST /api/v1/ocr/recognize
       * Body 参数：file: File (图片文件)
       */
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ocr/recognize`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '识别失败');
      }

      // 解析 OCR 结果并创建任务
      const ocrResult = result.data as OCRResult;

      if (!ocrResult.patients || ocrResult.patients.length === 0) {
        Alert.alert('识别结果', '未检测到病人信息，请重新拍摄');
        setIsProcessing(false);
        return;
      }

      // 批量创建任务
      const taskDate = new Date().toISOString();
      let createdCount = 0;

      for (const patient of ocrResult.patients) {
        for (const treatment of patient.treatments) {
          try {
            /**
             * 服务端文件：server/src/routes/tasks.ts
             * 接口：POST /api/v1/tasks
             * Body 参数：patientName: string, bedNumber: string, taskDate: string, treatmentName: string, duration: number
             */
            const taskResponse = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/tasks`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                patientName: patient.name,
                bedNumber: patient.bedNumber,
                taskDate,
                treatmentName: treatment.name,
                duration: treatment.duration,
              }),
            });

            if (taskResponse.ok) {
              createdCount++;
            }
          } catch (error) {
            console.error('Failed to create task:', error);
          }
        }
      }

      setIsProcessing(false);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(
        '识别成功',
        `成功创建 ${createdCount} 个治疗任务`,
        [
          { text: '继续拍照', style: 'cancel' },
          { text: '查看任务', onPress: () => router.navigate('/') },
        ]
      );
    } catch (error) {
      console.error('Error during recognition:', error);
      Alert.alert('错误', '识别失败，请重试');
      setIsProcessing(false);
    }
  };

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={styles.permissionContainer}>
          <ThemedView level="root" style={styles.permissionContent}>
            <FontAwesome6 name="camera" size={64} color={theme.textMuted} />
            <ThemedText variant="h3" color={theme.textPrimary} style={styles.permissionTitle}>
              需要相机权限
            </ThemedText>
            <ThemedText variant="body" color={theme.textSecondary} style={styles.permissionText}>
              我们需要访问相机来拍摄治疗表格
            </ThemedText>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <ThemedText variant="title" color={theme.buttonPrimaryText}>授予权限</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        enableTorch={false}
      >
        <View style={styles.overlay}>
          {/* 顶部提示 */}
          <View style={styles.topBar}>
            <ThemedView level="tertiary" style={styles.hintBox}>
              <ThemedText variant="small" color={theme.textPrimary}>
                将治疗表格放在取景框内
              </ThemedText>
            </ThemedView>
          </View>

          {/* 中间取景框 */}
          <View style={styles.frameContainer}>
            <View style={styles.frame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
          </View>

          {/* 底部控制区 */}
          <View style={styles.bottomBar}>
            {/* 切换摄像头按钮 */}
            <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
              <FontAwesome6 name="rotate" size={24} color={theme.buttonPrimaryText} />
            </TouchableOpacity>

            {/* 拍照按钮 */}
            <TouchableOpacity
              style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
              onPress={takePicture}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color={theme.buttonPrimaryText} />
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </TouchableOpacity>

            {/* 占位按钮（保持对称） */}
            <View style={styles.controlButton} />
          </View>

          {/* 处理中遮罩 */}
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <ThemedView level="root" style={styles.processingBox}>
                <ActivityIndicator size="large" color={theme.primary} />
                <ThemedText variant="body" color={theme.textPrimary} style={styles.processingText}>
                  正在识别表格...
                </ThemedText>
              </ThemedView>
            </View>
          )}
        </View>
      </CameraView>
    </Screen>
  );
}
