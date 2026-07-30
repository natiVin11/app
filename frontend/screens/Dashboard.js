import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, Platform, TouchableOpacity, Modal, TextInput, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';

const getBaseUrl = () => {
    // חיבור ישיר לשרת שלך שרץ בענן ב-Render
    return 'https://app-w9kf.onrender.com';
};

// הגדרות להתראות קופצות כשהאפליקציה פתוחה
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export default function Dashboard({ route }) {
    const { companyId, companyName } = route?.params || { companyId: 1, companyName: 'העסק שלי' };

    const [transactions, setTransactions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('active');

    const [actualBalance, setActualBalance] = useState(0);
    const [expectedBalance, setExpectedBalance] = useState(0);

    // סטייט למודל הוספת עסקה
    const [modalVisible, setModalVisible] = useState(false);
    const [newType, setNewType] = useState('income');
    const [newAmount, setNewAmount] = useState('');
    const [newClient, setNewClient] = useState('');
    const [newClientHp, setNewClientHp] = useState(''); // שדה ח.פ
    const [newClientPhone, setNewClientPhone] = useState(''); // שדה טלפון
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

    // סטייט למודל תשלום (חוק המזומן)
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('credit'); // credit, cash, transfer

    // בקשת הרשאה להתראות באייפון בעת טעינת המסך
    useEffect(() => {
        const registerForPushNotifications = async () => {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                Alert.alert('התראות חסומות', 'מומלץ לאשר התראות כדי לקבל תזכורות על עיכוב בתשלומים.');
                return;
            }
        };
        registerForPushNotifications();
        fetchData();
    }, []);

    const calculateBalances = (data) => {
        let actual = 0;
        let expected = 0;
        data.forEach(item => {
            const amount = parseFloat(item.amount) || 0;
            const modifier = item.type === 'income' ? amount : -amount;
            expected += modifier;
            if (item.status === 'paid') actual += modifier;
        });
        setActualBalance(actual);
        setExpectedBalance(expected);
    };

    const fetchData = async () => {
        if (!companyId) return;
        try {
            const response = await fetch(`${getBaseUrl()}/api/transactions?companyId=${companyId}`);
            if (!response.ok) throw new Error('שגיאה בשליפת נתונים');
            const data = await response.json();
            setTransactions(data);
            calculateBalances(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddTransaction = async () => {
        if (!newAmount || !newClient || !newDate) {
            Alert.alert('שגיאה', 'נא למלא את כל השדות החובה (סכום, שם עסק ותאריך)');
            return;
        }
        const parsedAmount = parseFloat(newAmount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            Alert.alert('שגיאה', 'נא להזין סכום תקין');
            return;
        }
        try {
            const response = await fetch(`${getBaseUrl()}/api/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyId,
                    type: newType,
                    amount: parsedAmount,
                    clientOrVendor: newClient,
                    clientHp: newClientHp,
                    clientPhone: newClientPhone,
                    dueDate: newDate
                })
            });
            if (!response.ok) throw new Error('שגיאה ביצירת העסקה');
            Alert.alert('הצלחה', 'העסקה נוספה בהצלחה לתזרים!');
            setModalVisible(false);
            setNewAmount('');
            setNewClient('');
            setNewClientHp('');
            setNewClientPhone('');
            fetchData();
        } catch (error) {
            Alert.alert('שגיאה', 'אירעה שגיאה בשמירת הנתונים.');
        }
    };

    // פתיחת חלון התשלום
    const openPaymentModal = (item) => {
        setSelectedTransaction(item);
        setPaymentMethod('credit');
        setPaymentModalVisible(true);
    };

    // אישור תשלום ואכיפת חוק המזומן
    const confirmPayment = async () => {
        if (paymentMethod === 'cash' && selectedTransaction.amount > 6000) {
            Alert.alert(
                '❌ חריגה מחוק המזומן',
                'על פי החוק לצמצום השימוש במזומן, לא ניתן לבצע עסקאות במזומן מעל 6,000 ש"ח.\n\nאנא בחר אמצעי תשלום חלופי.',
                [{ text: 'הבנתי', style: 'cancel' }]
            );
            return;
        }

        try {
            const response = await fetch(`${getBaseUrl()}/api/transactions/${selectedTransaction.id}/pay`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentMethod })
            });
            if (!response.ok) throw new Error('שגיאה בעדכון');

            Alert.alert('הצלחה!', 'התשלום התקבל וקבלה הונפקה ונשמרה במערכת.');
            setPaymentModalVisible(false);
            fetchData();
        } catch (error) {
            Alert.alert('שגיאה', 'לא הצלחנו להשלים את הפעולה.');
        }
    };

    // צפייה ב-PDF
    const viewReceipt = (transactionId) => {
        const url = `${getBaseUrl()}/api/transactions/${transactionId}/receipt`;
        Linking.openURL(url).catch(() => {
            Alert.alert('שגיאה', 'לא ניתן לפתוח את הקבלה כרגע.');
        });
    };

    // שליחת הקבלה בוואטסאפ אוטומטית דרך השרת (סופר אדמין)
    const sendViaWhatsApp = async (item) => {
        if (!item.clientPhone) {
            Alert.alert('שגיאה', 'לא הוזן מספר טלפון ללקוח/עסק הזה. אנא עדכן את פרטי העסקה.');
            return;
        }

        try {
            const response = await fetch(`${getBaseUrl()}/api/transactions/${item.id}/send-whatsapp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: item.clientPhone })
            });

            const data = await response.json();
            if (response.ok) {
                Alert.alert('הצלחה 💬', 'החשבונית וההודעה נשלחו ללקוח בהצלחה דרך מערכת הוואטסאפ של השרת!');
            } else {
                Alert.alert('שגיאה', data.error || 'שליחת הוואטסאפ נכשלה.');
            }
        } catch (error) {
            Alert.alert('שגיאת תקשורת', 'לא ניתן ליצור קשר עם שרת הוואטסאפ.');
        }
    };

    const filteredTransactions = transactions.filter(item => {
        const matchesSearch = item.clientOrVendor.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'history' ? item.status === 'paid' : item.status === 'expected';
        return matchesSearch && matchesTab;
    });

    return (
        <View style={styles.container}>
            <Text style={styles.header}>ניהול תזרים - {companyName}</Text>

            <View style={styles.dashboardCards}>
                <View style={[styles.card, { backgroundColor: '#e8f5e9' }]}>
                    <Text style={styles.cardTitle}>בפועל (שולם)</Text>
                    <Text style={[styles.cardValue, { color: actualBalance >= 0 ? '#2e7d32' : '#c62828' }]}>{actualBalance.toLocaleString()} ₪</Text>
                </View>
                <View style={[styles.card, { backgroundColor: '#fff3e0' }]}>
                    <Text style={styles.cardTitle}>צפי סוף חודש</Text>
                    <Text style={[styles.cardValue, { color: expectedBalance >= 0 ? '#ef6c00' : '#c62828' }]}>{expectedBalance.toLocaleString()} ₪</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
                <Text style={styles.addButtonText}>+ הוסף הכנסה / הוצאה עתידית</Text>
            </TouchableOpacity>

            <TextInput
                style={styles.searchInput}
                placeholder="🔍 חפש לפי שם לקוח או ספק..."
                value={searchQuery}
                onChangeText={setSearchQuery}
            />

            <View style={styles.tabsContainer}>
                <TouchableOpacity style={[styles.tab, activeTab === 'active' && styles.activeTab]} onPress={() => setActiveTab('active')}>
                    <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>תזרים פעיל</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === 'history' && styles.activeTab]} onPress={() => setActiveTab('history')}>
                    <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>היסטוריית קבלות</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={filteredTransactions}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={[styles.item, item.status === 'paid' && styles.itemPaid]}>
                        <View style={styles.itemDetails}>
                            <Text style={styles.itemTitle}>{item.clientOrVendor}</Text>
                            <Text style={styles.itemDate}>תאריך: {item.dueDate}</Text>
                        </View>
                        <View style={styles.itemAction}>
                            <Text style={[styles.itemAmount, { color: item.type === 'income' ? '#2e7d32' : '#c62828' }]}>
                                {item.type === 'income' ? '+' : '-'}{item.amount} ₪
                            </Text>

                            {item.status === 'expected' ? (
                                <TouchableOpacity style={styles.payButton} onPress={() => openPaymentModal(item)}>
                                    <Text style={styles.payButtonText}>הפק קבלה</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.actionButtonsRow}>
                                    <TouchableOpacity style={styles.whatsappButton} onPress={() => sendViaWhatsApp(item)}>
                                        <Text style={styles.whatsappButtonText}>💬 שלח</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.pdfButton} onPress={() => viewReceipt(item.id)}>
                                        <Text style={styles.pdfButtonText}>📄 צפה</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>לא נמצאו תוצאות.</Text>}
            />

            {/* --- מודל אישור תשלום וחוק המזומן --- */}
            <Modal visible={paymentModalVisible} animationType="fade" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalHeader}>אישור תשלום והפקת קבלה</Text>
                        {selectedTransaction && (
                            <Text style={styles.paymentAmountText}>סכום לתשלום: {selectedTransaction.amount} ₪</Text>
                        )}
                        <Text style={{textAlign: 'right', marginBottom: 10}}>בחר אמצעי תשלום:</Text>

                        <View style={styles.paymentMethodsContainer}>
                            <TouchableOpacity style={[styles.paymentMethodBtn, paymentMethod === 'credit' && styles.paymentMethodActive]} onPress={() => setPaymentMethod('credit')}>
                                <Text style={[styles.paymentMethodText, paymentMethod === 'credit' && styles.paymentMethodTextActive]}>💳 אשראי</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.paymentMethodBtn, paymentMethod === 'transfer' && styles.paymentMethodActive]} onPress={() => setPaymentMethod('transfer')}>
                                <Text style={[styles.paymentMethodText, paymentMethod === 'transfer' && styles.paymentMethodTextActive]}>🏦 העברה</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.paymentMethodBtn, paymentMethod === 'cash' && styles.paymentMethodActive]} onPress={() => setPaymentMethod('cash')}>
                                <Text style={[styles.paymentMethodText, paymentMethod === 'cash' && styles.paymentMethodTextActive]}>💵 מזומן</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.saveButton} onPress={confirmPayment}>
                            <Text style={styles.saveButtonText}>אישור והפקה</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => setPaymentModalVisible(false)}>
                            <Text style={styles.cancelButtonText}>ביטול</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* --- מודל הוספת עסקה --- */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalHeader}>רישום עסקה חדשה</Text>
                        <View style={styles.typeSelector}>
                            <TouchableOpacity style={[styles.typeButton, newType === 'income' && styles.typeButtonActiveIncome]} onPress={() => setNewType('income')}>
                                <Text style={styles.typeButtonText}>הכנסה (+)</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.typeButton, newType === 'expense' && styles.typeButtonActiveExpense]} onPress={() => setNewType('expense')}>
                                <Text style={styles.typeButtonText}>הוצאה (-)</Text>
                            </TouchableOpacity>
                        </View>
                        <TextInput style={styles.input} placeholder="סכום (₪) *" keyboardType="numeric" value={newAmount} onChangeText={setNewAmount} />
                        <TextInput style={styles.input} placeholder={newType === 'income' ? "שם הלקוח / עסק *" : "שם הספק / הוצאה *"} value={newClient} onChangeText={setNewClient} />
                        <TextInput style={styles.input} placeholder="ח.פ / עוסק מורשה (אופציונלי)" keyboardType="numeric" value={newClientHp} onChangeText={setNewClientHp} />
                        <TextInput style={styles.input} placeholder="טלפון הלקוח / ספק (לשליחת וואטסאפ)" keyboardType="phone-pad" value={newClientPhone} onChangeText={setNewClientPhone} />
                        <TextInput style={styles.input} placeholder="תאריך יעד (YYYY-MM-DD) *" value={newDate} onChangeText={setNewDate} />

                        <TouchableOpacity style={styles.saveButton} onPress={handleAddTransaction}>
                            <Text style={styles.saveButtonText}>שמור עסקה</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                            <Text style={styles.cancelButtonText}>ביטול</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
    header: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#333' },
    dashboardCards: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    card: { flex: 1, padding: 15, borderRadius: 10, marginHorizontal: 5, elevation: 2, alignItems: 'center' },
    cardTitle: { fontSize: 13, color: '#555', marginBottom: 5, fontWeight: '600' },
    cardValue: { fontSize: 18, fontWeight: 'bold' },
    addButton: { backgroundColor: '#1976d2', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
    addButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    searchInput: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginBottom: 15, textAlign: 'right', fontSize: 16 },
    tabsContainer: { flexDirection: 'row', marginBottom: 15 },
    tab: { flex: 1, padding: 12, alignItems: 'center', borderBottomWidth: 2, borderColor: 'transparent' },
    activeTab: { borderColor: '#1976d2' },
    tabText: { fontSize: 16, color: '#777' },
    activeTabText: { color: '#1976d2', fontWeight: 'bold' },
    item: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 1 },
    itemPaid: { backgroundColor: '#f9f9f9', opacity: 0.8 },
    itemDetails: { flex: 1, alignItems: 'flex-end' },
    itemTitle: { fontSize: 16, fontWeight: 'bold', textAlign: 'right' },
    itemDate: { fontSize: 14, color: '#777', marginTop: 2, textAlign: 'right' },
    itemAction: { alignItems: 'flex-start', justifyContent: 'center', minWidth: 90 },
    itemAmount: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    payButton: { backgroundColor: '#4caf50', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 5, alignItems: 'center' },
    payButtonText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
    actionButtonsRow: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center' },
    whatsappButton: { backgroundColor: '#25D366', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 5, alignItems: 'center', marginLeft: 8 },
    whatsappButtonText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    pdfButton: { backgroundColor: '#e0e0e0', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 5, alignItems: 'center', borderWidth: 1, borderColor: '#ccc' },
    pdfButtonText: { color: '#333', fontSize: 12, fontWeight: 'bold' },
    emptyText: { textAlign: 'center', marginTop: 30, fontSize: 16, color: '#666' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 12, elevation: 5 },
    modalHeader: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    paymentAmountText: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#d32f2f' },
    paymentMethodsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    paymentMethodBtn: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginHorizontal: 5, alignItems: 'center' },
    paymentMethodActive: { backgroundColor: '#e3f2fd', borderColor: '#1976d2' },
    paymentMethodText: { fontSize: 14, color: '#555' },
    paymentMethodTextActive: { color: '#1976d2', fontWeight: 'bold' },
    typeSelector: { flexDirection: 'row', marginBottom: 15 },
    typeButton: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#ccc', alignItems: 'center', marginHorizontal: 5, borderRadius: 8 },
    typeButtonActiveIncome: { backgroundColor: '#e8f5e9', borderColor: '#2e7d32' },
    typeButtonActiveExpense: { backgroundColor: '#ffebee', borderColor: '#c62828' },
    typeButtonText: { fontWeight: 'bold', color: '#333' },
    input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 12, textAlign: 'right', fontSize: 16 },
    saveButton: { backgroundColor: '#1976d2', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    cancelButton: { padding: 15, alignItems: 'center', marginTop: 5 },
    cancelButtonText: { color: '#777', fontSize: 16, fontWeight: 'bold' }
});
