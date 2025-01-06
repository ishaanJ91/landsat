const mongoose = require('mongoose');
const {Schema} = mongoose;

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        min: 2,
        max: 50,
    },
    email: {
        type: String,
        required: true,
        min: 6,
        max: 255,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        max: 18,
        min: 6,
    },
})

const UserModel = mongoose.model('User', userSchema);
module.exports = UserModel;

