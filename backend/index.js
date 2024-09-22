const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const User = require('./models/user'); 

require('dotenv').config();

const app = express();

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = 'mylandsatsecretkey';  

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    credentials: true,
    origin: 'http://localhost:3001',  
}));

// 

mongoose.connect('mongodb+srv://landsat:nlqMwPp931udYWoO@landsat.hetv1.mongodb.net/test?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.get('/test', (req, res) => {
    res.json('Test ok');
});

app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const userDoc = await User.create({
            name,
            email,
            password: bcrypt.hashSync(password, bcryptSalt),
        });
        res.json(userDoc);
    } catch (error) {
        res.status(422).json(error);
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const userDoc = await User.findOne({ email });
    if (userDoc) {
        const passOk = bcrypt.compareSync(password, userDoc.password);
        if (passOk) {
            jwt.sign(
                { email: userDoc.email, id: userDoc._id },
                jwtSecret,
                {},
                (err, token) => {
                    if (err) throw err;
                    res.cookie('token', token).json(userDoc);
                }
            );
        } else {
            res.status(422).json('Invalid password');
        }
    } else {
        res.status(404).json('User not found');
    }
});

app.get('/profile', (req, res) => {
    const { token } = req.cookies;

    if (token) {
        jwt.verify(token, jwtSecret, {}, async (err, userData) => {
            if (err) throw err;
            const { name, email, _id } = await User.findById(userData.id);
            res.json({ name, email, _id });
        });
    } else {
        res.status(401).json('No token');
    }
});

app.post('/logout', (req, res) => {
    res.cookie('token', '').json(true);
});

app.listen(3001, () => {
    console.log('Server running on port 3001');
});