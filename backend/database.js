const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// יצירה או חיבור לקובץ מסד הנתונים
const dbPath = path.resolve(__dirname, 'cashflow.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('שגיאה בחיבור למסד הנתונים:', err.message);
    } else {
        console.log('מחובר ל-SQLite בהצלחה.');
    }
});

// יצירת טבלת התזרים
db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT CHECK( type IN ('income', 'expense') ) NOT NULL,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      clientOrVendor TEXT NOT NULL,
      dueDate TEXT NOT NULL,
      status TEXT CHECK( status IN ('expected', 'paid', 'late') ) DEFAULT 'expected'
    )
  `);
});

module.exports = db;