import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Platform } from 'react-native';

const getBaseUrl = () => {
    if (Platform.OS === 'web') return 'http://localhost:3000';
    if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
    return 'http://localhost:3000';
};

export default function Register({ navigation }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [companyId, setCompanyId] = useState('');

    const handleRegister = async () => {
        if (!username || !password) {
            Alert.alert('שגיאה', 'יש למלא שם משתמש וסיסמא');
            return;
        }

        try {
            const response = await fetch(`${getBaseUrl()}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    password,
                    companyId: companyId ? parseInt(companyId) : 1, // ברירת מחדל משייך לחברה 1 אם לא הוזן
                    role: 'user'
                })
            });

            const data = await response.json();

            if (!response.ok) {
                // תופס שגיאת 400 Bad Request ומציג למשתמש מה הבעיה (למשל: המשתמש תפוס)
                Alert.alert('שגיאה בהרשמה', data.error || 'אירעה שגיאה בביצוע הפעולה');
                return;
            }

            Alert.alert('הצלחה', 'המשתמש נרשם בהצלחה!');
            navigation.navigate('Login');
        } catch (error) {
            console.error('שגיאת תקשורת ב-Register:', error);
            Alert.alert('שגיאת תקשורת', 'אין חיבור לשרת.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>הרשמה למערכת</Text>

            <TextInput
                style={styles.input}
                placeholder="שם משתמש"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="סיסמא"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            <TextInput
                style={styles.input}
                placeholder="מזהה חברה (אופציונלי)"
                keyboardType="numeric"
                value={companyId}
                onChangeText={setCompanyId}
            />

            <View style={styles.buttonContainer}>
                <Button title="הרשם" onPress={handleRegister} />
            </View>
            <Button title="חזור להתחברות" color="#888" onPress={() => navigation.navigate('Login')} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#FFF' },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: { borderWidth: 1, borderColor: '#CCC', borderRadius: 8, padding: 12, marginBottom: 15, textAlign: 'right' },
    buttonContainer: { marginBottom: 15 }
});