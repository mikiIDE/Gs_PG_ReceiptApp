import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { receiptAPI } from "../services/api";
import moment from "moment";

export default function HomeScreen({ navigation }) {
  const [receipts, setReceipts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReceipts = async () => {
    try {
      const data = await receiptAPI.getReceipts();
      setReceipts(data);
    } catch (error) {
      console.error("レシート取得エラー:", error);
    }
  };

  // 画面がフォーカスされるたびに実行
  useFocusEffect(
    React.useCallback(() => {
      fetchReceipts();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReceipts();
    setRefreshing(false);
  };

  const renderReceipt = ({ item }) => (
    <View style={styles.receiptCard}>
      <Text style={styles.storeName}>{item.storeName}</Text>
      <Text style={styles.date}>
        {moment(item.purchaseDate).format("YYYY/MM/DD")}
      </Text>
      <Text style={styles.amount}>¥{item.totalAmount?.toLocaleString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={receipts}
        renderItem={renderReceipt}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>レシートがありません</Text>
        }
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("AddReceipt")}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  receiptCard: {
    backgroundColor: "white",
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  storeName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  date: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  amount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2196F3",
    marginTop: 5,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#999",
  },
  addButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  addButtonText: {
    fontSize: 30,
    color: "white",
  },
});
