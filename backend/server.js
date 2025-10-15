require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fs = require('fs');
const https = require('https');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
 
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
                status TEXT DEFAULT 'pending',
                googleCalendarEventId TEXT
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
    // New photos from Adnan's Instagram
    { src: 'https://scontent-arn2-1.cdninstagram.com/v/t51.2885-15/369900000_1000000000000000_1000000000000000_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=18de74&_nc_ohc=0000000000000000&_nc_ht=scontent-arn2-1.cdninstagram.com&edm=AOQ1c0wEAAAA&oh=00000000000000000000000000000000&oe=67123456&_nc_vs=00000000000000000000000000000000', alt: 'Portrait of a woman', category: 'portrait', title: 'Elegant Gaze', price: 95.00 },
    { src: 'https://scontent-arn2-1.cdninstagram.com/v/t51.2885-15/369900000_1000000000000000_1000000000000000_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=18de74&_nc_ohc=0000000000000000&_nc_ht=scontent-arn2-1.cdninstagram.com&edm=AOQ1c0wEAAAA&oh=00000000000000000000000000000000&oe=67123456&_nc_vs=00000000000000000000000000000000', alt: 'Landscape with mountains', category: 'landscape', title: 'Mountain Serenity', price: 110.00 },
    { src: 'https://scontent-arn2-1.cdninstagram.com/v/t51.2885-15/369900000_1000000000000000_1000000000000000_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=18de74&_nc_ohc=0000000000000000&_nc_ht=scontent-arn2-1.cdninstagram.com&edm=AOQ1c0wEAAAA&oh=00000000000000000000000000000000&oe=67123456&_nc_vs=00000000000000000000000000000000', alt: 'Street photography', category: 'street', title: 'Urban Life', price: 85.00 },
    { src: 'https://scontent-arn2-1.cdninstagram.com/v/t51.2885-15/369900000_1000000000000000_1000000000000000_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=18de74&_nc_ohc=0000000000000000&_nc_ht=scontent-arn2-1.cdninstagram.com&edm=AOQ1c0wEAAAA&oh=00000000000000000000000000000000&oe=67123456&_nc_vs=00000000000000000000000000000000', alt: 'Another portrait', category: 'portrait', title: 'Thoughtful Glance', price: 100.00 },
    { src: 'https://scontent-arn2-1.cdninstagram.com/v/t51.2885-15/369900000_1000000000000000_1000000000000000_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=18de74&_nc_ohc=0000000000000000&_nc_ht=scontent-arn2-1.cdninstagram.com&edm=AOQ1c0wEAAAA&oh=00000000000000000000000000000000&oe=67123456&_nc_vs=00000000000000000000000000000000', alt: 'Another landscape', category: 'landscape', title: 'Golden Hour', price: 120.00 },
    { src: 'https://scontent-arn2-1.cdninstagram.com/v/t51.2885-15/369900000_1000000000000000_1000000000000000_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=18de74&_nc_ohc=0000000000000000&_nc_ht=scontent-arn2-1.cdninstagram.com&edm=AOQ1c0wEAAAA&oh=00000000000000000000000000000000&oe=67123456&_nc_vs=00000000000000000000000000000000', alt: 'Another street photo', category: 'street', title: 'City Rhythms', price: 90.00 },
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

// Google Calendar API setup
const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// If using a service account, load the key file
if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH) {
    const key = require(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH);
    oAuth2Client.fromJSON(key);
    oAuth2Client.scopes = ['https://www.googleapis.com/auth/calendar'];
} else {
    // For OAuth2 flow, you would need to handle token acquisition and refresh
    // For simplicity, this example assumes a pre-authorized token or service account
    // In a real application, you'd implement a flow to get and store refresh tokens
    console.warn("Google Service Account Key Path not provided. Ensure OAuth2 tokens are managed.");
}

const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

// Helper function to get busy times from Google Calendar
async function getBusyTimes(calendarId, timeMin, timeMax) {
    try {
        const response = await calendar.freebusy.query({
            auth: oAuth2Client,
            resource: {
                items: [{ id: calendarId }],
                timeMin: timeMin.toISOString(),
                timeMax: timeMax.toISOString(),
            },
        });
        return response.data.calendars[calendarId].busy;
    } catch (error) {
        console.error('Error fetching busy times from Google Calendar:', error.message);
        throw new Error('Failed to fetch available slots.');
    }
}

// New endpoint to get available booking slots
app.get('/api/calendar/available-slots', async (req, res) => {
    const { startDate, endDate, durationMinutes } = req.query;
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    if (!startDate || !endDate || !durationMinutes || !calendarId) {
        return res.status(400).json({ error: "startDate, endDate, durationMinutes, and GOOGLE_CALENDAR_ID are required." });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationMs = parseInt(durationMinutes) * 60 * 1000; // duration in milliseconds

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || isNaN(durationMs)) {
        return res.status(400).json({ error: "Invalid date or duration format." });
    }

    try {
        const busyTimes = await getBusyTimes(calendarId, start, end);
        const availableSlots = [];

        // Define working hours (e.g., 9 AM to 5 PM) and buffer
        const workingHoursStart = 9; // 9 AM
        const workingHoursEnd = 17; // 5 PM
        const bufferMinutes = 15; // 15 minutes buffer between appointments

        let currentTime = new Date(start);
        currentTime.setHours(workingHoursStart, 0, 0, 0); // Start checking from working hours

        while (currentTime.getTime() + durationMs <= end.getTime()) {
            const slotEnd = new Date(currentTime.getTime() + durationMs);

            // Check if slot is within working hours
            if (currentTime.getHours() >= workingHoursStart && slotEnd.getHours() <= workingHoursEnd) {
                let isBusy = false;
                for (const busy of busyTimes) {
                    const busyStart = new Date(busy.start);
                    const busyEnd = new Date(busy.end);

                    // Check for overlap with busy times, including buffer
                    if (
                        (currentTime.getTime() < busyEnd.getTime() + (bufferMinutes * 60 * 1000)) &&
                        (slotEnd.getTime() > busyStart.getTime() - (bufferMinutes * 60 * 1000))
                    ) {
                        isBusy = true;
                        break;
                    }
                }

                if (!isBusy) {
                    availableSlots.push({
                        start: currentTime.toISOString(),
                        end: slotEnd.toISOString(),
                    });
                }
            }

            // Move to the next potential slot, considering duration and buffer
            currentTime = new Date(currentTime.getTime() + (durationMinutes * 60 * 1000) + (bufferMinutes * 60 * 1000));
            // If moving to next day, reset to working hours start
            if (currentTime.getHours() > workingHoursEnd) {
                currentTime.setDate(currentTime.getDate() + 1);
                currentTime.setHours(workingHoursStart, 0, 0, 0);
            }
        }

        res.json(availableSlots);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// New endpoint to create a booking in Google Calendar
app.post('/api/bookings/google-calendar', async (req, res) => {
    const { serviceType, date, time, duration, clientName, clientEmail } = req.body;
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    if (!serviceType || !date || !time || !duration || !clientName || !clientEmail || !calendarId) {
        return res.status(400).json({ error: "All booking fields and GOOGLE_CALENDAR_ID are required." });
    }

    const startDateTime = new Date(`${date}T${time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + (duration * 60 * 60 * 1000)); // duration in hours

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        return res.status(400).json({ error: "Invalid date or time format." });
    }

    const event = {
        summary: `${serviceType} with ${clientName}`,
        description: `Client Email: ${clientEmail}\nService: ${serviceType}\nDuration: ${duration} hours`,
        start: {
            dateTime: startDateTime.toISOString(),
            timeZone: 'UTC', // Or dynamically get from client/server
        },
        end: {
            dateTime: endDateTime.toISOString(),
            timeZone: 'UTC', // Or dynamically get from client/server
        },
        attendees: [
            { email: clientEmail },
            // Add your own calendar email if you want to be an attendee
            // { email: 'your-calendar-email@example.com' },
        ],
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'email', minutes: 24 * 60 },
                { method: 'popup', minutes: 10 },
            ],
        },
    };

    try {
        const response = await calendar.events.insert({
            auth: oAuth2Client,
            calendarId: calendarId,
            resource: event,
        });

        const googleCalendarEventId = response.data.id;

        // Store booking in local database
        const insert = 'INSERT INTO bookings (serviceType, date, time, duration, googleCalendarEventId) VALUES (?,?,?,?,?)';
        db.run(insert, [serviceType, date, time, duration, googleCalendarEventId], function(err) {
            if (err) {
                console.error("Error inserting booking into local DB:", err.message);
                // Consider rolling back Google Calendar event if DB insert fails
                return res.status(500).json({ error: "Booking created in Google Calendar, but failed to save locally." });
            }
            res.status(201).json({
                message: 'Booking created successfully',
                bookingId: this.lastID,
                googleCalendarEventId: googleCalendarEventId,
                serviceType,
                date,
                time,
                duration
            });
        });

    } catch (e) {
        console.error('Error creating Google Calendar event:', e.message);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: "Name, email, and message are required." });
    }

    // Create a Nodemailer transporter using SMTP
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'novtec.x.ab@gmail.com', // The target email address
        subject: `New Contact Form Submission from ${name}`,
        html: `
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong> ${message}</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Email sent successfully!' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send email.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});