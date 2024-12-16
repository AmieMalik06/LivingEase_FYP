// app.js
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes= require('./routes/userRoutes')
const propertyRoutes = require('./routes/propertyRoutes');
const tenantRoutes=require('./routes/tenantRoutes');
const landlordRoutes=require('./routes/landlordRoutes')
const rentalApplicationRoutes=require('./routes/rentalApplicationRoutes')
const appointmentRoutes=require('./routes/appointmentRoutes')
const leaseAgreementRoutes = require('./routes/leaseAgreementRoutes');
const ratingRoutes= require ('./routes/ratingRoutes')
const recommendationsRoute = require('./routes/recommendationsRoutes');
const messageRoutes = require('./routes/messageRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const maintenanceRoutes=require('./routes/maintenanceRoutes');
const notificationRoutes=require('./routes/notificationRoutes');
const serviceProviderRoutes=require('./routes/serviceproviderRoutes');
const bidRoutes = require('./routes/bidRoutes');
const commissionRoutes= require ('./routes/commissionRoutes')
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;
const timeout = require('connect-timeout');
const adminRoutes = require('./routes/adminRoutes');

dotenv.config();

const app = express(); 

connectDB();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

app.use(cors());
app.use(timeout('200s'));
app.use(express.json());
app.get('/', (req, res) => {
  res.send('API is running...');
});
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/property', propertyRoutes);
app.use ('/api/landlord', landlordRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api/rentalApplication', rentalApplicationRoutes);
app.use('/api/appointment',appointmentRoutes)
app.use('/api/leaseAgreement',leaseAgreementRoutes)
app.use('/api/rating',ratingRoutes)
app.use('/api/recommendations', recommendationsRoute); 
app.use('/api/messages', messageRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/serviceprovider', serviceProviderRoutes);
app.use('/api/bid', bidRoutes);
app.use('/api/admin', adminRoutes); 
app.use('/api/commission', commissionRoutes);
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

module.exports = app;