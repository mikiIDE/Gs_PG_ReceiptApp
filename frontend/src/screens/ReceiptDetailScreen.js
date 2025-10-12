import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { receiptAPI } from '../services/api';
import moment from 'moment';

export default function ReceiptDetailScreen({ navigation, route }) {
  const { receiptId } = route.params;
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // 編集用のstate
  const [storeName, setStoreName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [items, setItems] = useState([]);

  // レシート詳細を取得
  useEffect(() => {
    fetchReceiptDetail();
  }, [receiptId]);

  const fetchReceiptDetail = async () => {
    try {
      setLoading(true);
      const data = await receiptAPI.getReceipts();
      const foundReceipt = data.find(r => r.id === receiptId);
      
      if (foundReceipt) {
        setReceipt(foundReceipt);
        setStoreName(foundReceipt.storeName);
        setTotalAmount(foundReceipt.totalAmount?.toString() || '');
        setPurchaseDate(foundReceipt.purchaseDate);
        setItems(foundReceipt.items || []);
      } else {
        Alert.alert('エラー', 'レシートが見つかりませんでした');
        navigation.goBack();
      }
    } catch (error) {
      console.error('レシート取得エラー:', error);
      Alert.alert('エラー', 'レシートの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    // 元のデータに戻す
    setStoreName(receipt.storeName);
    setTotalAmount(receipt.totalAmount?.toString() || '');
    setPurchaseDate(receipt.purchaseDate);
    setItems(receipt.items || []);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!storeName || !totalAmount || !purchaseDate) {
      Alert.alert('エラー', '店舗名、合計金額、購入日は必須です');
      return;
    }

    try {
      const receiptData = {
        storeName,
        totalAmount: parseFloat(totalAmount),
        purchaseDate,
        items: items.map(item => ({
          name: item.name,
          price: parseFloat(item.price),
          category: item.category || '未分類'
        }))
      };

      await receiptAPI.updateReceipt(receiptId, receiptData);
      Alert.alert('成功', 'レシートを更新しました');
      setIsEditing(false);
      fetchReceiptDetail(); // 最新データを再取得
    } catch (error) {
      Alert.alert('エラー', 'レシートの更新に失敗しました');
      console.error(error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      '削除確認',
      'このレシートを削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '削除', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await receiptAPI.deleteReceipt(receiptId);
              Alert.alert('成功', 'レシートを削除しました', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              Alert.alert('エラー', 'レシートの削除に失敗しました');
              console.error(error);
            }
          }
        }
      ]
    );
  };

  const addItem = () => {
    setItems([...items, { name: '', price: '', category: '' }]);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  if (!receipt) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>レシートが見つかりません</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>店舗名</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={storeName}
            onChangeText={setStoreName}
            placeholder="例: セブンイレブン"
          />
        ) : (
          <Text style={styles.valueText}>{storeName}</Text>
        )}

        <Text style={styles.label}>合計金額</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={totalAmount}
            onChangeText={setTotalAmount}
            placeholder="例: 1980"
            keyboardType="numeric"
          />
        ) : (
          <Text style={styles.valueText}>¥{parseFloat(totalAmount).toLocaleString()}</Text>
        )}

        <Text style={styles.label}>購入日</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={purchaseDate}
            onChangeText={setPurchaseDate}
            placeholder="YYYY-MM-DD"
          />
        ) : (
          <Text style={styles.valueText}>{moment(purchaseDate).format('YYYY/MM/DD')}</Text>
        )}

        <Text style={styles.sectionTitle}>商品明細</Text>
        {isEditing ? (
          <>
            {items.map((item, index) => (
              <View key={index} style={styles.itemContainer}>
                <TextInput
                  style={[styles.input, styles.itemInput]}
                  value={item.name}
                  onChangeText={(text) => updateItem(index, 'name', text)}
                  placeholder="商品名"
                />
                <TextInput
                  style={[styles.input, styles.itemInput, styles.priceInput]}
                  value={item.price?.toString()}
                  onChangeText={(text) => updateItem(index, 'price', text)}
                  placeholder="価格"
                  keyboardType="numeric"
                />
                {items.length > 1 && (
                  <TouchableOpacity onPress={() => removeItem(index)} style={styles.removeButton}>
                    <Text style={styles.removeButtonText}>削除</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity style={styles.addItemButton} onPress={addItem}>
              <Text style={styles.addItemButtonText}>+ 商品を追加</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.itemsList}>
            {items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemName}>• {item.name}</Text>
                <Text style={styles.itemPrice}>¥{item.price?.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ボタン */}
        <View style={styles.buttonContainer}>
          {isEditing ? (
            <>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
                <Text style={styles.buttonText}>保存</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
                <Text style={styles.buttonText}>キャンセル</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={[styles.button, styles.editButton]} onPress={handleEdit}>
                <Text style={styles.buttonText}>編集</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDelete}>
                <Text style={styles.buttonText}>削除</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#999',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 15,
    color: '#333',
  },
  valueText: {
    fontSize: 18,
    marginBottom: 10,
    color: '#000',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  input: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 15,
  },
  itemsList: {
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemName: {
    fontSize: 16,
    color: '#333',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  itemContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  itemInput: {
    flex: 1,
    marginRight: 10,
  },
  priceInput: {
    flex: 0.5,
  },
  removeButton: {
    padding: 10,
  },
  removeButtonText: {
    color: 'red',
  },
  addItemButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    alignItems: 'center',
  },
  addItemButtonText: {
    color: '#333',
  },
  buttonContainer: {
    marginTop: 30,
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#9E9E9E',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
