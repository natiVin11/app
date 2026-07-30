const express = require('express');
const cors = require('cors'); // חשוב כדי שהאפליקציה תוכל לגשת לשרת
const app = express();
const db = require('./database'); // או הנתיב המדויק שבו מוגדר ומוצא ה-db אצלך בפרויקט

app.use(cors());
app.use(express.json());

// חיבור הנתיבים שיצרנו
const transactionsRoutes = require('./routes/transactions');
app.use('/api/transactions', transactionsRoutes);

app.get('/', (req, res) => {
    res.send('🚀 LION GROUP CRM Backend is running successfully!');
});
const createDefaultAdmin = async () => {
    const adminUsername = 'admin';
    const plainPassword = '123456';

    // בדיקה האם האדמין כבר קיים
    db.get(`SELECT * FROM users WHERE username = ?`, [adminUsername], async (err, row) => {
        if (err) {
            console.error('שגיאה בבדיקת קיום אדמין אוטומטי:', err.message);
            return;
        }

        if (!row) {
            // אם האדמין לא קיים, ניצור אותו
            try {
                const hashedPassword = await bcrypt.hash(plainPassword, 10);
                db.run(
                    `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
                    [adminUsername, hashedPassword, 'superadmin'],
                    (insertErr) => {
                        if (insertErr) {
                            console.error('שגיאה ביצירת משתמש אדמין אוטומטי:', insertErr.message);
                        } else {
                            console.log('✅ משתמש אדמין נוצר בהצלחה אוטומטית! (username: admin, password: 123456)');
                        }
                    }
                );
            } catch (hashErr) {
                console.error('שגיאה בהצפנת סיסמת אדמין:', hashErr.message);
            }
        } else {
            console.log('ℹ️ משתמש אדמין כבר קיים במערכת.');
        }
    });
};


createDefaultAdmin();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
