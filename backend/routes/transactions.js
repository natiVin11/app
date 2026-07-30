const express = require('express');
const router = express.Router();
const db = require('../database');

// שליפת כל התנועות לתזרים, מסודר לפי תאריך יעד
router.get('/', (req, res) => {
    const sql = `SELECT * FROM transactions ORDER BY dueDate ASC`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// הוספת תנועה חדשה (הכנסה או הוצאה)
router.post('/', (req, res) => {
    const { type, amount, description, clientOrVendor, dueDate, status } = req.body;
    const sql = `INSERT INTO transactions (type, amount, description, clientOrVendor, dueDate, status) 
               VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [type, amount, description, clientOrVendor, dueDate, status || 'expected'];

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: 'התנועה נוספה בהצלחה' });
    });
});

// עדכון סטטוס (למשל מ"צפוי" ל"שולם")
router.put('/:id/status', (req, res) => {
    const { status } = req.body;
    const sql = `UPDATE transactions SET status = ? WHERE id = ?`;
    db.run(sql, [status, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'סטטוס עודכן' });
    });
});

module.exports = router;