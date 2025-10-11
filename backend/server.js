require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fs = require('fs');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
    res.send('Stureby Photography Backend API');
});

// Initialize SQLite database
const db = new sqlite3.Database('./stureby.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            src TEXT,
            alt TEXT,
            category TEXT,
            title TEXT,
            price REAL
        )`, (err) => {
            if (err) {
                console.error("Error creating photos table:", err.message);
                return;
            }
            console.log('Photos table ensured.');

            db.run(`CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                serviceType TEXT,
                date TEXT,
                time TEXT,
                duration INTEGER,
                status TEXT DEFAULT 'pending'
            )`, (err) => {
                if (err) {
                    console.error("Error creating bookings table:", err.message);
                    return;
                }
                console.log('Bookings table ensured.');

                // Insert sample photos if the table is empty
                db.get("SELECT COUNT(*) AS count FROM photos", (err, row) => {
                    if (err) {
                        console.error("Error checking photos table:", err.message);
                        return;
                    }
                    if (row.count === 0) {
                        const insert = 'INSERT INTO photos (src, alt, category, title, price) VALUES (?,?,?,?,?)';
                        initialPhotos.forEach(photo => {
                            db.run(insert, [photo.src, photo.alt, photo.category, photo.title, photo.price], function(err) {
                                if (err) {
                                    console.error("Error inserting sample photo:", err.message);
                                }
                            });
                        });
                        console.log('Sample photos inserted.');
                    }
                });
            });
        });
    }
});

const initialPhotos = [
    { src: 'https://picsum.photos/id/1015/300/200', alt: 'Forest Path', category: 'nature', title: 'Mystical Forest Path', price: 65.00 },
    { src: 'https://picsum.photos/id/1018/300/200', alt: 'Mountain Landscape', category: 'nature', title: 'Majestic Mountain View', price: 80.00 },
    { src: 'https://picsum.photos/id/1025/300/200', alt: 'Dog Portrait', category: 'people', title: 'Loyal Companion', price: 50.00 },
    { src: 'https://picsum.photos/id/1039/300/200', alt: 'Desert Road', category: 'travel', title: 'Endless Desert Road', price: 70.00 },
    { src: 'https://picsum.photos/id/1040/300/200', alt: 'Boat on Lake', category: 'nature', title: 'Serene Lake Morning', price: 55.00 },
    { src: 'https://picsum.photos/id/1043/300/200', alt: 'Coffee Cup', category: 'still-life', title: 'Morning Brew', price: 45.00 },
    { src: 'https://picsum.photos/id/1047/300/200', alt: 'Cityscape at Night', category: 'city', title: 'Urban Glow', price: 90.00 },
    { src: 'https://picsum.photos/id/1050/300/200', alt: 'Abstract Art', category: 'abstract', title: 'Colorful Abstraction', price: 75.00 },
    { src: 'https://picsum.photos/id/1053/300/200', alt: 'Old Car', category: 'vintage', title: 'Classic Ride', price: 60.00 },
    { src: 'https://picsum.photos/id/1054/300/200', alt: 'Bridge', category: 'architecture', title: 'Architectural Marvel', price: 85.00 },
];

// Get all photos from database
app.get('/api/photos', (req, res) => {
    db.all("SELECT * FROM photos", [], (err, rows) => {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.json(rows);
    });
});

// Create Stripe Checkout Session for product purchase
app.post('/api/create-checkout-session', async (req, res) => {
    const { photoId } = req.body;

    db.get("SELECT * FROM photos WHERE id = ?", [photoId], async (err, photo) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (!photo) {
            res.status(404).json({ error: "Photo not found" });
            return;
        }

        try {
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: photo.title,
                                images: [photo.src],
                            },
                            unit_amount: Math.round(photo.price * 100), // Price in cents
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: `${req.protocol}://${req.get('host')}/frontend/index.html?success=true`,
                cancel_url: `${req.protocol}://${req.get('host')}/frontend/index.html?canceled=true`,
            });
            res.json({ id: session.id });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });
});

// Swish Payment Request Endpoint
app.post('/api/swish/payment-request', async (req, res) => {
    const { amount, message, payerAlias } = req.body; // payerAlias is the Swish number of the customer

    if (!amount || !message || !payerAlias) {
        return res.status(400).json({ error: "Amount, message, and payerAlias are required for Swish payment." });
    }

    const paymentRequest = {
        payeePaymentReference: "SturebyPhoto" + Date.now(),
        callbackUrl: process.env.SWISH_CALLBACK_URL,
        payerAlias: payerAlias,
        payeeAlias: process.env.SWISH_MERCHANT_ID,
        amount: amount.toString(),
        currency: "SEK",
        message: message
    };

    const options = {
        hostname: new URL(process.env.SWISH_API_BASE_URL).hostname,
        port: 443,
        path: '/swish-cpcapi/api/v2/paymentrequests',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(JSON.stringify(paymentRequest))
        },
        cert: fs.readFileSync(process.env.SWISH_PAYMENT_REQUEST_CERTIFICATE_PATH),
        key: fs.readFileSync(process.env.SWISH_PAYMENT_REQUEST_KEY_PATH),
        passphrase: '' // If your key has a passphrase, provide it here
    };

    const swishReq = https.request(options, (swishRes) => {
        let data = '';
        swishRes.on('data', (chunk) => {
            data += chunk;
        });
        swishRes.on('end', () => {
            if (swishRes.statusCode === 201) {
                const location = swishRes.headers.location;
                const paymentRequestToken = location.split('/').pop();
                res.status(201).json({
                    message: 'Swish payment request initiated',
                    paymentRequestToken: paymentRequestToken,
                    paymentRequest: paymentRequest,
                    location: location
                });
            } else {
                res.status(swishRes.statusCode).json({ error: JSON.parse(data) });
            }
        });
    });

    swishReq.on('error', (e) => {
        console.error(`Problem with Swish request: ${e.message}`);
        res.status(500).json({ error: e.message });
    });

    swishReq.write(JSON.stringify(paymentRequest));
    swishReq.end();
});

// Swish Callback Endpoint
app.post('/api/swish/callback', (req, res) => {
    console.log('Swish Callback Received:', req.body);
    // Here you would update your database with the payment status
    // and potentially notify the user.
    res.status(200).json({ message: 'Callback received' });
});

// Create a new booking
app.post('/api/bookings', (req, res) => {
    const { serviceType, date, time, duration } = req.body;

    if (!serviceType || !date || !time || !duration) {
        return res.status(400).json({ error: "All fields are required for booking." });
    }

    const insert = 'INSERT INTO bookings (serviceType, date, time, duration) VALUES (?,?,?,?)';
    db.run(insert, [serviceType, date, time, duration], function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.status(201).json({
            message: 'Booking created successfully',
            bookingId: this.lastID,
            serviceType,
            date,
            time,
            duration
        });
    });
});

// Create Stripe Checkout Session for booking
app.post('/api/create-booking-checkout-session', async (req, res) => {
    const { serviceType, date, time, duration } = req.body;

    // For simplicity, using a fixed price for booking. In a real app, this would be dynamic.
    const bookingPrice = 100.00 * duration; // $100 per hour

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Booking: ${serviceType} on ${date} at ${time} for ${duration} hours`,
                            description: `Service Type: ${serviceType}, Date: ${date}, Time: ${time}, Duration: ${duration} hours`,
                        },
                        unit_amount: Math.round(bookingPrice * 100), // Price in cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${req.protocol}://${req.get('host')}/frontend/index.html?bookingSuccess=true`,
            cancel_url: `${req.protocol}://${req.get('host')}/frontend/index.html?bookingCanceled=true`,
        });
        res.json({ id: session.id });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});