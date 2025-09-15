import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import TextRecognition from '@react-native-ml-kit/text-recognition';

export default function OCRScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const cameraRef = useRef(null);

  // カメラ権限チェック
  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>カメラの権限が必要です</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>権限を許可</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 写真撮影とOCR処理
  const takePictureAndRecognize = async () => {
    if (!cameraRef.current) return;

    try {
      setIsProcessing(true);
      
      // 写真撮影
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      // MediaLibraryに保存（オプション）
      if (mediaPermission?.granted) {
        await MediaLibrary.saveToLibraryAsync(photo.uri);
      }

      // ML Kit でテキスト認識
      const result = await TextRecognition.recognize(photo.uri);
      setRecognizedText(result.text);

      Alert.alert(
        'テキスト認識完了',
        'レシートのテキストを認識しました。結果を確認してください。',
        [
          { text: 'OK' },
          {
            text: 'レシート追加画面へ',
            onPress: () => processRecognizedText(result.text),
          },
        ]
      );
    } catch (error) {
      console.error('OCR エラー:', error);
      Alert.alert('エラー', 'テキスト認識に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  // 認識されたテキストを処理してレシート追加画面へ
  const processRecognizedText = (text) => {
    // TODO: ChatGPT API で構造化処理
    // 今は簡単な処理として、レシート追加画面に遷移
    navigation.navigate('AddReceipt', {
      ocrText: text,
    });
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
      >
        <View style={styles.overlay}>
          <Text style={styles.instruction}>
            レシートをカメラに映してください
          </Text>
          
          <TouchableOpacity
            style={[styles.captureButton, isProcessing && styles.disabledButton]}
            onPress={takePictureAndRecognize}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.captureButtonText}>撮影</Text>
            )}
          </TouchableOpacity>
        </View>
      </CameraView>

      {recognizedText ? (
        <ScrollView style={styles.resultContainer}>
          <Text style={styles.resultTitle}>認識結果:</Text>
          <Text style={styles.resultText}>{recognizedText}</Text>
          <TouchableOpacity
            style={styles.processButton}
            onPress={() => processRecognizedText(recognizedText)}
          >
            <Text style={styles.processButtonText}>
              レシート追加画面へ進む
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 50,
  },
  instruction: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 10,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  captureButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 5,
    margin: 20,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  resultContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    maxHeight: 300,
    padding: 15,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  processButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  processButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
