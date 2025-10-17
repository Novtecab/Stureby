require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Dummy data for demonstration
const photos = [
    { id: 'photo1', src: '/assets/placeholder_image1.png', alt: 'Landscape Photo 1', title: 'Mountain View', category: 'landscape', price: 25.00 },
    { id: 'photo2', src: '/assets/placeholder_image2.png', alt: 'Portrait Photo 1', title: 'Smiling Face', category: 'portrait', price: 35.00 },
    { id: 'photo3', src: '/assets/placeholder_image1.png', alt: 'Wildlife Photo 1', title: 'Eagle in Flight', category: 'wildlife', price: 45.00 },
    { id: 'photo4', src: 'https://cdn-st3.vigbo.com/u38921/51521/blog/4059620/2762054/74051352/2000-1236b6523a4b828f2e534dd9765101a2.jpg', alt: 'Stureby Creative Agency 2025', title: 'Stureby Creative Agency 2025', category: 'Art', price: 20.00 },
    { id: 'photo5', src: 'https://cdn-st3.vigbo.com/u38921/51521/blog/4059617/7796314/preview/2000-crop--f1ae7ce6e5c9ebc3ac9c75a53520ca3b.jpg?v=2', alt: 'Stureby Creative Agency 2025', title: 'Stureby Creative Agency 2025', category: 'Art', price: 20.00 },
    { id: 'photo6', src: 'https://cdn-st3.vigbo.com/u38921/51521/blog/4059617/7717710/preview/2000-crop--c1cf873659c0d26c4a089048bbea00dc.jpg?v=1', alt: 'Stureby Creative Agency 2025', title: 'Stureby Creative Agency 2025', category: 'Art', price: 20.00 },
];

const magazine = {
    id: 'magazine1',
    title: 'Photography Monthly - October Issue',
    description: 'A deep dive into astrophotography and urban landscapes.',
    coverImage: '/assets/placeholder_image1.png',
    price: 15.00,
    releaseDate: '2023-10-26',
};

const services = [
    { id: 'service1', title: 'Corporate Photography', description: 'Professional headshots and team photos.', image: '/assets/placeholder_image1.png', details: ['On-site shoot', 'Digital delivery', 'Retouching'], price: 200.00 },
    { id: 'service2', title: 'Product Photography', description: 'High-quality images for your e-commerce store.', image: '/assets/placeholder_image2.png', details: ['Studio shoot', 'White background', 'High-res files'], price: 150.00 },
    { id: 'service3', title: 'Fashion Photography', description: 'Stunning visuals for your lookbook or campaign.', image: '/assets/placeholder_image1.png', details: ['Location shoot', 'Model direction', 'Post-production'], price: 300.00 },
];

// API Endpoints
app.get('/api/photos', (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : photos.length;
    res.json(photos.slice(0, limit));
});

app.get('/api/magazine', (req, res) => {
    res.json(magazine);
});

app.get('/api/services', (req, res) => {
    res.json(services);
});

// Stripe Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
    const { items } = req.body;

    const line_items = items.map(item => {
        let product;
        if (item.type === 'photo') {
            product = photos.find(p => p.id === item.id);
        } else if (item.type === 'magazine') {
            product = magazine.id === item.id ? magazine : null;
        } else if (item.type === 'booking') {
            product = services.find(s => s.id === item.id);
        }

        if (!product) {
            throw new Error(`Product with ID ${item.id} not found.`);
        }

        return {
            price_data: {
                currency: 'usd',
                product_data: {
                    name: product.title,
                },
                unit_amount: product.price * 100, // Price in cents
            },
            quantity: item.quantity,
        };
    });

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
            success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/canceled`,
        });
        res.json({ id: session.id });
    } catch (error) {
        console.error('Error creating Stripe checkout session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Google Calendar Integration
const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Set up a transporter for Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail', // or any other email service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

app.get('/api/calendar/available-slots', async (req, res) => {
    const { startDate, endDate, durationMinutes } = req.query;

    if (!startDate || !endDate || !durationMinutes) {
        return res.status(400).json({ error: 'Missing required query parameters: startDate, endDate, durationMinutes' });
    }

    try {
        oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
        const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

        const response = await calendar.freebusy.query({
            auth: oAuth2Client,
            resource: {
                items: [{ id: process.env.GOOGLE_CALENDAR_ID }],
                timeMin: new Date(startDate).toISOString(),
                timeMax: new Date(endDate).toISOString(),
            },
        });

        const busySlots = response.data.calendars[process.env.GOOGLE_CALENDAR_ID].busy || [];
        const allDaySlots = generateDaySlots(startDate, endDate, parseInt(durationMinutes));

        const availableSlots = allDaySlots.filter(slot => {
            // Check if the slot overlaps with any busy slot
            return !busySlots.some(busy => {
                const busyStart = new Date(busy.start);
                const busyEnd = new Date(busy.end);
                const slotStart = new Date(slot.start);
                const slotEnd = new Date(slot.end);

                return (slotStart < busyEnd && slotEnd > busyStart);
            });
        });

        res.json(availableSlots);

    } catch (error) {
        console.error('Error fetching available slots:', error);
        res.status(500).json({ error: 'Failed to fetch available slots.' });
    }
});

function generateDaySlots(startDate, endDate, durationMinutes) {
    const slots = [];
    const startOfDay = new Date(startDate);
    startOfDay.setHours(9, 0, 0, 0); // Start at 9 AM
    const endOfDay = new Date(startDate);
    endOfDay.setHours(17, 0, 0, 0); // End at 5 PM

    let currentTime = startOfDay;
    while (currentTime.getTime() + durationMinutes * 60 * 1000 <= endOfDay.getTime()) {
        const slotStart = new Date(currentTime);
        const slotEnd = new Date(currentTime.getTime() + durationMinutes * 60 * 1000);
        slots.push({ start: slotStart.toISOString(), end: slotEnd.toISOString() });
        currentTime = new Date(currentTime.getTime() + durationMinutes * 60 * 1000);
    }
    return slots;
}


app.post('/api/bookings/google-calendar', async (req, res) => {
    const { serviceType, date, time, duration, clientName, clientEmail } = req.body;

    try {
        oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
        const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

        const startDateTime = new Date(`${date}T${time}:00`);
        const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 60 * 1000); // duration in hours

        const event = {
            summary: `${serviceType} Session with ${clientName}`,
            description: `Client Email: ${clientEmail}\nService: ${serviceType}\nDuration: ${duration} hours`,
            start: {
                dateTime: startDateTime.toISOString(),
                timeZone: 'UTC', // Assuming UTC for simplicity, adjust as needed
            },
            end: {
                dateTime: endDateTime.toISOString(),
                timeZone: 'UTC',
            },
            attendees: [
                { email: clientEmail },
                { email: process.env.GOOGLE_CALENDAR_ID }, // The photographer's calendar
            ],
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 },
                    { method: 'popup', minutes: 10 },
                ],
            },
        };

        const response = await calendar.events.insert({
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            resource: event,
        });

        // Send confirmation email to client
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: clientEmail,
            subject: `Booking Confirmation: ${serviceType} Session`,
            html: `<p>Dear ${clientName},</p>
                   <p>Your ${serviceType} session has been confirmed for ${date} at ${time} UTC.</p>
                   <p>We look forward to seeing you!</p>
                   <p>Stureby Photography Team</p>`,
        });

        res.status(200).json({ message: 'Booking successful!', event: response.data });

    } catch (error) {
        console.error('Error creating Google Calendar event or sending email:', error);
        res.status(500).json({ error: 'Failed to create booking.' });
    }
});

// Associate Application Endpoint
app.post('/api/apply', async (req, res) => {
    const { name, email, phone, portfolio, experience, gear, message } = req.body;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: 'novtec.x.ab@gmail.com', // Associate application recipient
            subject: `New Photography Associate Application from ${name}`,
            html: `<p>Name: ${name}</p>
                   <p>Email: ${email}</p>
                   <p>Phone: ${phone || 'N/A'}</p>
                   <p>Portfolio: ${portfolio || 'N/A'}</p>
                   <p>Experience: ${experience || 'N/A'} years</p>
                   <p>Gear: ${gear || 'N/A'}</p>
                   <p>Message: ${message || 'N/A'}</p>`,
        });

        res.status(200).json({ message: 'Application submitted successfully!' });
    } catch (error) {
        console.error('Error sending associate application email:', error);
        res.status(500).json({ error: 'Failed to submit application.' });
    }
});

// Contact Form Endpoint
app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: 'novtec.x.ab@gmail.com', // Contact form recipient
            subject: `New Contact Form Submission from ${name}`,
            html: `<p>Name: ${name}</p>
                   <p>Email: ${email}</p>
                   <p>Message: ${message}</p>`,
        });

        res.status(200).json({ message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Error sending contact form email:', error);
        res.status(500).json({ error: 'Failed to send message.' });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});