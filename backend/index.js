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
const jwtSecret = 'mysecretkey';  

// Middlewares
app.use(express.json());
app.use(cookieParser());

mongoose.connect(process.env.MONGO_URL);     

app.use(cors({
    credentials: true,
    origin: 'http://localhost:3000',  
}));

  app.get('/test', (req, res) => {
    res.json('test ok');
});

app.post('/register', async (req, res) => {
    const{ name, email, password } = req.body;
    try {
        const userDoc = await User.create({ 
            name, 
            email, 
            password: bcrypt.hashSync(password, bcryptSalt) 
        });
        res.json(userDoc);
    } catch (e) {
        res.status(422).json(e);
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const userDoc = await User.findOne({ email });

    if (userDoc) {
        const passOk = bcrypt.compareSync(password, userDoc.password);
        if (passOk) {
            jwt.sign({ email: userDoc.email, id: userDoc._id }, jwtSecret, {}, (err, token) => {
                if (err) throw err;
                console.log("Generated Token:", token); // Log the generated token
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                }).json(userDoc);
            });
        } else {
            res.status(422).json('pass not ok');
        }
    } else {
        res.json('not found');
    }
});



app.get('/profile', (req, res) => {
    const { token } = req.cookies;
    console.log("Cookies:", req.cookies); // Log cookies to check if token is there

    if (!token) {
        return res.status(401).json('no token'); // Immediately return if there's no token
    }

    if (token) {
        jwt.verify(token, jwtSecret, {}, async (err, userData) => {
            if (err) {
                return res.status(401).json('invalid token');
            }
            const user = await User.findById(userData.id);

            if (!user) {
                return res.status(404).json('User not found');
            }
            const { name, email, _id } = user;
            res.json({ name, email, _id });
        });
    } else {
        res.status(401).json('no token');
    }
});

app.post('/logout', (req, res) => {
    res.cookie('token', '').json(true);
});



app.listen(3001);