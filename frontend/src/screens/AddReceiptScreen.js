import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { receiptAPI } from '../services/api';
import moment from 'moment';

export default function AddReceiptScreen({ navigation }) {
  const [storeName, setStoreName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(moment().format('YYYY-MM-DD'));
  const [items, setItems] = useState([{ name: '', price: '', category: '' }]);

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

  const handleSubmit = async () => {
    if (!storeName || !totalAmount || !purchaseDate) {
      Alert.alert('エラー', '店舗名、合計金額、購入日は必須です');
      return;
    }

    try {
      const receiptData = {
        storeName,
        totalAmount: parseFloat(totalAmount),
        purchaseDate,
        items: items.filter(item => item.name && item.price)
      };

      await receiptAPI.addReceipt(receiptData);
      Alert.alert('成功', 'レシートを追加しました', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('エラー', 'レシートの追加に失敗しました');
      console.error(error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>店舗名 *</Text>
        <TextInput
          style={styles.input}
          value={storeName}
          onChangeText={setStoreName}
          placeholder="例: セブンイレブン"
        />

        <Text style={styles.label}>合計金額 *</Text>
        <TextInput
          style={styles.input}
          value={totalAmount}
          onChangeText={setTotalAmount}
          placeholder="例: 1980"
          keyboardType="numeric"
        />

        <Text style={styles.label}>購入日 *</Text>
        <TextInput
          style={styles.input}
          value={purchaseDate}
          onChangeText={setPurchaseDate}
          placeholder="YYYY-MM-DD"
        />

        <Text style={styles.sectionTitle}>商品明細</Text>
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
              value={item.price}
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

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>登録</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 15,
  },
  input: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 15,
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
  submitButton: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#2196F3',
    borderRadius: 5,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
