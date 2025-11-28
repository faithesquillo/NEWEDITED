const mongoose = require('mongoose');

const PRICING = {
    PREMIUM_SEAT_SURCHARGE: 30,
    BAGGAGE_RATE_PER_KG: 5,
    TAX_RATE: 0.12,
};

const reservationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    flightId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Flight',
        required: true
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        match: [/^[A-Za-z][A-Za-z\s'-]{1,}$/, 'Please enter a valid first name (letters, spaces, hyphens, apostrophes only).'],
        minlength: [2, 'First name must be at least 2 characters.']
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        match: [/^[A-Za-z][A-Za-z\s'-]{1,}$/, 'Please enter a valid last name (letters, spaces, hyphens, apostrophes only).'],
        minlength: [2, 'Last name must be at least 2 characters.']
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        match: [/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/, 'Please enter a valid email address.']
    },
    passport: {
        type: String,
        required: true,
        match: [/^[A-Za-z0-9]{7,9}$/, 'Passport number must be 7 to 9 alphanumeric characters.'],
    },
    seat: {
        code: { type: String, required: true },
        isPremium: { type: Boolean, default: false }
    },
    meal: {
        label: { type: String, default: 'None' },
        price: { type: Number, default: 0 }
    },
    baggage: {
        kg: { type: Number, default: 0 },
    },
    bill: {
        baseFare: { type: Number, default: 0 },
        seatFee: { type: Number, default: 0 },
        mealFee: { type: Number, default: 0 },
        baggageFee: { type: Number, default: 0 },
        subtotal: { type: Number, default: 0 },
        tax: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    },
    status: {
        type: String,
        default: 'booked'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    pnr: {
        type: String,
        required: true,
        unique: true
    },
    checkedIn: {
        type: Boolean,
        default: false
    },
    boardingPassNo: {
        type: String,
        default: null,
        unique: true
    }

});

reservationSchema.pre('save', function() {
    this.meal.price = Number(this.meal.price) || 0;
    this.baggage.kg = Number(this.baggage.kg) || 0;

    this.bill.baseFare = Number(this.bill.baseFare) || 0;
    this.bill.seatFee = this.seat.isPremium ? PRICING.PREMIUM_SEAT_SURCHARGE : 0;
    this.bill.mealFee = this.meal.price;
    this.bill.baggageFee = this.baggage.kg * PRICING.BAGGAGE_RATE_PER_KG;

    const subtotal = this.bill.baseFare + this.bill.seatFee + this.bill.mealFee + this.bill.baggageFee;
    const tax = subtotal * PRICING.TAX_RATE;

    this.bill.subtotal = subtotal;
    this.bill.tax = tax;
    this.bill.total = subtotal + tax;
});

// for atomic double-booking 
reservationSchema.index(
    { 
        flightId: 1, 
        'seat.code': 1 
    },
    { 
        unique: true,
        partialFilterExpression: { status: { $ne: 'cancelled' } } 
    }
);

module.exports = mongoose.model('Reservation', reservationSchema);

