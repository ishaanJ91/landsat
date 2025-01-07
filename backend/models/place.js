const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
    country: String,
    city: String,
    grid: [String],
    coordinates: {
        latitude: String,
        longitude: String,
    },
    dateSaved: { type: Date, default: Date.now },

})

const PlaceModel = mongoose.model('Place', placeSchema);
module.exports = PlaceModel;

