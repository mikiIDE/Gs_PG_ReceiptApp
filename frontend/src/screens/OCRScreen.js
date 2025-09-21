import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import TextRecognition, { TextRecognitionScript } from "@react-native-ml-kit/text-recognition";
import { structureReceiptData } from '../services/chatgpt';

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
      
      // 写真撮影（高品質設定）
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1.0,           // 最高品質に変更
        skipProcessing: true,   // 余計な画像処理をスキップ
        base64: false,
      });

      // MediaLibraryに保存（オプション）
      if (mediaPermission?.granted) {
        await MediaLibrary.saveToLibraryAsync(photo.uri);
      }

      // ML Kit でテキスト認識（日本語スクリプト明示）
      const result = await TextRecognition.recognize(
        photo.uri, 
        TextRecognitionScript.JAPANESE
      );
      console.log('Japanese Script OCR Result:', result);
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
  const processRecognizedText = async (text) => {
    try {
      setIsProcessing(true);
      
      // ChatGPT API でレシートテキストを構造化
      console.log('ChatGPT APIでテキスト構造化を開始...');
      const structuredData = await structureReceiptData(text);
      
      console.log('構造化結果:', structuredData);
      
      // 構造化されたデータをAddReceiptScreenに渡す
      navigation.navigate('AddReceipt', {
        ocrText: text,
        structuredData: structuredData,
        isFromOCR: true
      });
      
    } catch (error) {
      console.error('テキスト構造化エラー:', error);
      Alert.alert(
        'エラー', 
        'テキストの構造化に失敗しました。手動入力で進みますか？',
        [
          { text: 'キャンセル', style: 'cancel' },
          { 
            text: '手動入力', 
            onPress: () => navigation.navigate('AddReceipt', {
              ocrText: text,
              isFromOCR: true
            })
          }
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
      />
      
      {/* カメラの上にオーバーレイを配置 */}
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

      {/* 認識結果表示エリア */}
      {recognizedText ? (
        <View style={styles.resultContainer}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>認識結果:</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setRecognizedText('')}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.resultScrollView}>
            <Text style={styles.resultText}>{recognizedText}</Text>
          </ScrollView>
          <TouchableOpacity
            style={styles.processButton}
            onPress={() => processRecognizedText(recognizedText)}
          >
            <Text style={styles.processButtonText}>レシート追加画面へ進む</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 50,
  },
  instruction: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 15,
    borderRadius: 10,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "white",
  },
  disabledButton: {
    backgroundColor: "#666",
  },
  captureButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 5,
    margin: 20,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
  },
  resultContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    maxHeight: 400,
    padding: 15,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
  },
  resultScrollView: {
    maxHeight: 200,
    marginBottom: 15,
  },
  resultText: {
    fontSize: 14,
    lineHeight: 20,
  },
  processButton: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  processButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
