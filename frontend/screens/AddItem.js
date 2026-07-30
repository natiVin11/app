import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';

const API_URL = 'http://10.0.2.2:3000/api/transactions';

export default function AddItem({ navigation }) {
    const [type, setType] = useState('income');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [clientOrVendor, setClientOrVendor] = useState('');
    const [dueDate, setDueDate] = useState(''); // מומלץ להחליף ברכיב DatePicker בהמשך

    const handleSave = async () => {
        if (!amount || !description || !clientOrVendor || !dueDate) {
            Alert.alert('שגיאה', 'יש למלא את כל השדות');
            return;
        }

        const newTransaction = {
            type,
            amount: parseFloat(amount),
            description,
            clientOrVendor,
            dueDate,
            status: 'expected'
        };

        try {
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTransaction)
            });
            Alert.alert('הצלחה', 'התנועה נשמרה בהצלחה');
            navigation.goBack(); // חוזרים למסך התזרים
        } catch (error) {
            Alert.alert('שגיאה', 'לא ניתן לשמור נתונים');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.typeSelector}>
                <Button title="הכנסה" color={type === 'income' ? 'green' : 'gray'} onPress={() => setType('income')} />
                <Button title="הוצאה" color={type === 'expense' ? 'red' : 'gray'} onPress={() => setType('expense')} />
            </View>

            <TextInput style={styles.input} placeholder="סכום (₪)" keyboardType="numeric" value={amount} onChangeText={setAmount} textAlign="right" />
            <TextInput style={styles.input} placeholder="תיאור (לדוגמה: בניית אתר)" value={description} onChangeText={setDescription} textAlign="right" />
            <TextInput style={styles.input} placeholder="לקוח / ספק" value={clientOrVendor} onChangeText={setClientOrVendor} textAlign="right" />
            <TextInput style={styles.input} placeholder="תאריך יעד (YYYY-MM-DD)" value={dueDate} onChangeText={setDueDate} textAlign="right" />

            <Button title="שמור תנועה" onPress={handleSave} color="#007BFF" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#FFF' },
    typeSelector: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
    input: { borderWidth: 1, borderColor: '#CCC', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 }
});