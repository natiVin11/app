import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

// החלף ב-IP של המחשב שלך במידה ואתה בודק על מכשיר פיזי
const API_URL = 'http://10.0.2.2:3000/api/transactions';

export default function Dashboard({ navigation }) {
    const [transactions, setTransactions] = useState([]);
    const [balance, setBalance] = useState({ income: 0, expense: 0, total: 0 });
    const isFocused = useIsFocused(); // מרענן נתונים כשחוזרים למסך

    useEffect(() => {
        if (isFocused) {
            fetchData();
        }
    }, [isFocused]);

    const fetchData = async () => {
        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            setTransactions(data);
            calculateBalance(data);
        } catch (error) {
            console.error(error);
        }
    };

    const calculateBalance = (data) => {
        let income = 0, expense = 0;
        data.forEach(item => {
            if (item.type === 'income') income += item.amount;
            else expense += item.amount;
        });
        setBalance({ income, expense, total: income - expense });
    };

    return (
        <View style={styles.container}>
            <View style={styles.summaryBox}>
                <Text style={styles.summaryText}>הכנסות צפויות: {balance.income} ₪</Text>
                <Text style={styles.summaryText}>הוצאות צפויות: {balance.expense} ₪</Text>
                <Text style={[styles.summaryTotal, { color: balance.total >= 0 ? 'green' : 'red' }]}>
                    תזרים עתידי: {balance.total} ₪
                </Text>
            </View>

            <FlatList
                data={transactions}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <Text style={item.type === 'income' ? styles.income : styles.expense}>
                                {item.type === 'income' ? '+' : '-'}{item.amount} ₪
                            </Text>
                            <Text style={styles.title}>{item.description}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.status}>סטטוס: {item.status}</Text>
                            <Text style={styles.details}>{item.clientOrVendor} | {item.dueDate}</Text>
                        </View>
                    </View>
                )}
            />

            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddItem')}>
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA', padding: 15 },
    summaryBox: { backgroundColor: '#fff', padding: 20, borderRadius: 10, marginBottom: 15, elevation: 2 },
    summaryText: { fontSize: 16, textAlign: 'right', marginBottom: 5 },
    summaryTotal: { fontSize: 18, fontWeight: 'bold', textAlign: 'right', marginTop: 10 },
    card: { backgroundColor: '#FFF', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 1 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    title: { fontSize: 16, fontWeight: 'bold' },
    income: { color: 'green', fontWeight: 'bold', fontSize: 16 },
    expense: { color: 'red', fontWeight: 'bold', fontSize: 16 },
    details: { color: '#555', fontSize: 14 },
    status: { color: '#007BFF', fontSize: 14, fontWeight: 'bold' },
    fab: { position: 'absolute', bottom: 20, left: 20, backgroundColor: '#007BFF', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
    fabIcon: { color: '#FFF', fontSize: 30, fontWeight: 'bold' }
});