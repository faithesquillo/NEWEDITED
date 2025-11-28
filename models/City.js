const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'City code is required.'],
        unique: true,
        trim: true,
        uppercase: true
    },
    name: {
        type: String,
        required: [true, 'City name is required.'],
        trim: true
    }
}, {
    timestamps: true
});

const City = mongoose.model('City', citySchema);

module.exports = City;

