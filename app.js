// app.js
const express = require('express');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Import routes
const { protect, adminOnly } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const departmentRoutes = require('./routes/departments');
const employeeRoutes = require('./routes/employees');
const apiRoutes = require('./routes/api');
// Add this with your other route imports
// const locationRoutes = require('./routes/locations');


// Connect to MongoDB
async function main() {
    await mongoose.connect(process.env.MONGO_ATLAS_LINK);
}

main()
    .then(() => {
        console.log("Connected to Database");
    })
    .catch((err) => {
        console.log(err);
    });

// Middleware
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride('_method'));

// Public routes (no authentication required)
app.use('/auth', authRoutes);

// Routes
app.get('/',protect, adminOnly, (req, res) => {
  res.render('index');
});


app.use('/departments',protect, adminOnly, departmentRoutes);
app.use('/employees',protect, adminOnly, employeeRoutes);
app.use('/api', apiRoutes);
// Add this with your other route middleware
// app.use('/locations', locationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { error: err });
});

    // JWT errors
    // if (err.name === 'JsonWebTokenError') {
    //     return res.status(401).render('auth/login', {
    //         title: 'Login Required',
    //         error: 'Invalid token. Please log in again.'
    //     });
    // }
    
    // if (err.name === 'TokenExpiredError') {
    //     return res.status(401).render('auth/login', {
    //         title: 'Session Expired',
    //         error: 'Your session has expired. Please log in again.'
    //     });
    // }

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { error: { message: 'Page not found' } });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
