// // backend/app.js
// const express = require('express');
// const cors = require('cors');
// const mysql = require('mysql2');
// const app = express();

// app.use(express.json());
// app.use(cors());

// // Create MySQL connection
// const connection = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: 'jai@123',
//     database: 'Ecommerce'
// });

// connection.connect((err) => {
//     if (err) {
//         console.error('Error connecting to the database:', err.stack);
//         return;
//     }
//     console.log('Connected to the database');
// });

// // Get all products
// app.get('/api/products', (req, res) => {
//     const sql = 'SELECT * FROM Products';
//     connection.query(sql, (err, results) => {
//         if (err) {
//             console.error('Error fetching products:', err);
//             return res.status(500).send('Error fetching products');
//         }
//         res.send(results);
//         console.log(results);
//     });
// });

// // Checkout process
// app.post('/api/checkout', (req, res) => {
//     const { user, cartItems } = req.body; // Assume user and cartItems are sent in the request body
//     const sqlUser = 'INSERT INTO Users (name, email) VALUES (?, ?)';
//     connection.query(sqlUser, [user.name, user.email], (err, result) => {
//         if (err) {
//             console.error('Error inserting user:', err);
//             return res.status(500).send('Error placing order');
//         }
//         const userId = result.insertId;
//         const totalAmount = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
//         const sqlOrder = 'INSERT INTO Orders (amount, user_id) VALUES (?, ?)';
//         connection.query(sqlOrder, [totalAmount, userId], (err, result) => {
//             if (err) {
//                 console.error('Error inserting order:', err);
//                 return res.status(500).send('Error placing order');
//             }
//             const orderId = result.insertId;
//             let completedQueries = 0;
//             const totalItems = cartItems.length;
            
//             cartItems.forEach(item => {
//                 let sqlOrderItem;
//                 if (item.category === 'Chairs') {
//                     sqlOrderItem = 'INSERT INTO Order_Chairs (order_id, chair_id) VALUES (?, ?)';
//                 } else if (item.category === 'Table') {
//                     sqlOrderItem = 'INSERT INTO Order_Tables (order_id, table_id) VALUES (?, ?)';
//                 } else if (item.category === 'Top') {
//                     sqlOrderItem = 'INSERT INTO Order_Tops (order_id, top_id) VALUES (?, ?)';
//                 }
//                 if (sqlOrderItem) {
//                     connection.query(sqlOrderItem, [orderId, item.id], (err) => {
//                         if (err) {
//                             console.error('Error inserting order item:', err);
//                             return res.status(500).send('Error placing order');
//                         }
//                         completedQueries++;
//                         if (completedQueries === totalItems) {
//                             res.send('Order placed successfully');
//                         }
//                     });
//                 }
//             });
//         });
//     });
// });

// const PORT = 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


// working with code

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const app = express();

app.use(express.json());
app.use(cors());

// Create MySQL connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'jai@123',
    database: 'Ecommerce'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err.stack);
        return;
    }
    console.log('Connected to the database');
});

// Get all products
app.get('/api/products', (req, res) => {
    const sql = 'SELECT * FROM Products';
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).send('Error fetching products');
        }
        res.send(results);
    });
});

// Checkout process
// In backend/index.js

app.post('/api/checkout', (req, res) => {
    const { user, cartItems } = req.body;

    // Check if user already exists
    const sqlFindUser = 'SELECT id FROM Users WHERE email = ?';
    connection.query(sqlFindUser, [user.email], (err, results) => {
        if (err) {
            console.error('Error checking user:', err);
            return res.status(500).send('Error placing order');
        }

        let userId;
        if (results.length > 0) {
            // User exists, use the existing user ID
            userId = results[0].id;
        } else {
            // User does not exist, insert new user
            const sqlInsertUser = 'INSERT INTO Users (name, email) VALUES (?, ?)';
            connection.query(sqlInsertUser, [user.name, user.email], (err, result) => {
                if (err) {
                    console.error('Error inserting user:', err);
                    return res.status(500).send('Error placing order');
                }
                userId = result.insertId;
                proceedWithOrder(userId);
            });
            return;
        }

        // Proceed with order creation if user already exists
        proceedWithOrder(userId);
    });

    function proceedWithOrder(userId) {
        const totalAmount = (cartItems || []).reduce((total, item) => total + (item.price * item.quantity), 0);
        
        // Insert order
        const sqlInsertOrder = 'INSERT INTO Orders (amount, user_id) VALUES (?, ?)';
        connection.query(sqlInsertOrder, [totalAmount, userId], (err, result) => {
            if (err) {
                console.error('Error inserting order:', err);
                return res.status(500).send('Error placing order');
            }

            const orderId = result.insertId;
            let completedQueries = 0;
            const totalItems = cartItems.length;

            cartItems.forEach(item => {
                let sqlOrderItem;
                const { category, id } = item;

                if (category === 'Chairs') {
                    sqlOrderItem = 'INSERT INTO Order_Chairs (order_id, chair_id) VALUES (?, ?)';
                } else if (category === 'Table') {
                    sqlOrderItem = 'INSERT INTO Order_Tables (order_id, table_id) VALUES (?, ?)';
                } else if (category === 'Top') {
                    sqlOrderItem = 'INSERT INTO Order_Tops (order_id, top_id) VALUES (?, ?)';
                }

                if (sqlOrderItem) {
                    connection.query(sqlOrderItem, [orderId, id], (err) => {
                        if (err) {
                            console.error('Error inserting order item:', err);
                            return res.status(500).send('Error placing order');
                        }
                        completedQueries++;
                        if (completedQueries === totalItems) {
                            res.send({ message: 'Order placed successfully' });
                        }
                    });
                } else {
                    completedQueries++;
                    if (completedQueries === totalItems) {
                        res.send({ message: 'Order placed successfully' });
                    }
                }
            });
        });
    }
});


const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
