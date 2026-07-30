const express = require('express');
const cors = require('cors'); // חשוב כדי שהאפליקציה תוכל לגשת לשרת
const app = express();

app.use(cors());
app.use(express.json());

// חיבור הנתיבים שיצרנו
const transactionsRoutes = require('./routes/transactions');
app.use('/api/transactions', transactionsRoutes);

app.get('/', (req, res) => {
    res.send('🚀 LION GROUP CRM Backend is running successfully!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
