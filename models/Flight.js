const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({
    flightNumber: {
        type: String,
        required: [true, 'A flight number is required.'],
        unique: true,
        trim: true,
        uppercase: true
    },

    origin: {
        type: String,
        required: [true, 'Origin is required.'],
        trim: true
    },

    destination: {
        type: String,
        required: [true, 'Destination is required.'],
        trim: true
    },

    schedule: {
        type: Date, 
        required: [true, 'A departure schedule is required.']
    },

    price: {
        type: Number,
        required: [true, 'A price is required.']
    },

    aircraftType: {
        type: String, 
        trim: true,
        default: 'Not specified'
    },

    airline: {
        type: String,
        required: [true, 'Airline is required.'],
        trim: true
    },

    seatCapacity: {
        type: Number,
        required: [true, 'Seat capacity is required.'],
        min: [1, 'Capacity must be at least 1 seat.']
    },

    seatsAvailable: {
        type: Number,
        min: [0, 'Seats available cannot be negative']
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

},
{
    timestamps: true
});

flightSchema.pre('save', function(next) {
    if (this.isNew && (this.seatsAvailable === undefined || this.seatsAvailable === null)) {
        this.seatsAvailable = this.seatCapacity;
    }
    next();
});

const Flight = mongoose.model('Flight', flightSchema);

module.exports = Flight;
