const Reservation = require('../models/Reservation');
const Flight = require('../models/Flight');
const User = require('../models/User');
const { generateUniquePNR } = require('../utils/utils');

const PREMIUM_ROWS = new Set([1, 2, 3, 4]);

// --- 1. GET Booking Form ---
exports.getBookingForm = async (req, res) => {
    try {
        const flight = await Flight.findOne({ flightNumber: req.params.flightNumber }).lean();
        if (!flight) return res.status(404).send('Flight not found');

        const now = new Date();
        if (new Date(flight.schedule) < now) {
            return res.status(400).send('Booking is closed: This flight has already departed or is scheduled for a past date.');
        }

        const activeReservations = await Reservation.find({
            flightId: flight._id,
            status: { $ne: 'cancelled' }
        }).select('seat.code');

        const occupiedSeats = activeReservations.map(r => r.seat.code);

        res.render('reservations/reservation', {
            flight,
            pageTitle: 'Book Flight',
            occupiedSeats: JSON.stringify(occupiedSeats),
            user: req.session.user
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// --- 2. POST Create Reservation ---
exports.createReservation = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            passport,
            seat,
            mealOption,
            baggage,
            flightId
        } = req.body;

        if (!firstName || !lastName || !email || !passport || !seat || !flightId)
            return res.status(400).json({ message: 'Missing required fields.' });

        const flight = await Flight.findById(flightId);
        if (!flight) return res.status(404).json({ message: 'Flight not found.' });

        // for the dates validation
        const now = new Date();
        if (new Date(flight.schedule) < now) {
            return res.status(400).json({ message: 'Booking failed: This flight has already departed.' });
        }
        
        const existingReservation = await Reservation.findOne({
            flightId,
            'seat.code': seat,
            status: { $ne: 'cancelled' }
        });

        if (existingReservation)
            return res.status(400).json({ message: `Seat ${seat} is already booked.` });

        const pnr = await generateUniquePNR();

        const seatRow = parseInt((seat.match(/^\d+/) || ['0'])[0], 10);
        const isPremiumSeat = PREMIUM_ROWS.has(seatRow);

        const mealLabel = mealOption?.label || 'None';
        const mealPrice = Number(mealOption?.price || 0);

        const newReservation = new Reservation({
            flightId,
            userId: req.session.user?._id || null,
            firstName,
            lastName,
            email,
            passport,
            seat: {
                code: seat,
                isPremium: isPremiumSeat
            },
            meal: {
                label: mealLabel,
                price: mealPrice
            },
            baggage: {
                kg: parseInt(baggage, 10) || 0
            },
            bill: {
                baseFare: flight.price
            },
            pnr
        });

        const savedReservation = await newReservation.save();
        res.status(201).json(savedReservation);
    } catch (error) {
        console.error('Reservation creation error:', error);

        if (error.code === 11000) {
             return res.status(400).json({ 
                 success:false,
                 message: `Seat ${req.body.seat} is already booked. A race condition was detected. Please choose another seat.`, 
                 error: error.message 
             });
         }

        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// --- 3. GET Edit Form ---
exports.getEditForm = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id)
            .populate('flightId')
            .lean();

        if (!reservation) return res.status(404).send('Reservation not found');

        const otherReservations = await Reservation.find({
            flightId: reservation.flightId._id,
            status: { $ne: 'cancelled' },
            _id: { $ne: reservation._id }
        }).select('seat.code');

        res.render('reservations/reservation-edit', {
            reservation,
            occupiedSeats: JSON.stringify(otherReservations.map(r => r.seat.code)),
            user: req.session.user
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading edit page');
    }
};

// --- 4. PUT Update Reservation ---
exports.updateReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const { seat, mealOption, baggage } = req.body;

        const reservation = await Reservation.findById(id);
        if (!reservation)
            return res.status(404).json({ success: false, message: 'Reservation not found' });

        if (seat && seat !== reservation.seat.code) {
            const existingReservation = await Reservation.findOne({
                flightId: reservation.flightId,
                'seat.code': seat,
                status: { $ne: 'cancelled' },
                _id: { $ne: id }
            });

            if (existingReservation)
                return res.status(400).json({
                    success: false,
                    message: `Seat ${seat} is already booked.`
                });
        }

        const oldTotal = reservation.bill.total;

        if (seat) {
            const seatRow = parseInt((seat.match(/^\d+/) || ['0'])[0], 10);
            reservation.seat.code = seat;
            reservation.seat.isPremium = PREMIUM_ROWS.has(seatRow);
        }

        if (mealOption) {
            reservation.meal.label = mealOption?.label || 'None';
            reservation.meal.price = Number(mealOption?.price || 0);
        }

        reservation.baggage.kg = parseInt(baggage, 10) || 0;

        const updatedReservation = await reservation.save();
        const newTotal = updatedReservation.bill.total;

        res.json({
            success: true,
            updatedReservation,
            amountDue: Math.max(0, newTotal - oldTotal)
        });

    } catch (error) {
        console.error('Reservation update error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// --- 5. GET Reservations List ---
exports.getAllReservations = async (req, res) => {
    try {
        const filter = {};
        if (req.session.user.role !== 'Admin') {
            filter.userId = req.session.user._id;
        }

        const reservations = await Reservation.find(filter)
            .populate('flightId')
            .lean();

        res.render('reservations/reservation-list', {
            reservations,
            user: req.session.user
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching reservations');
    }
};

// --- 6. GET Admin View: User Reservations ---
exports.getUserReservationsAdmin = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).send('User not found');

        const reservations = await Reservation.find({ userId: user._id })
            .populate('flightId')
            .lean();

        res.render('userReservations', {
            title: `${user.fullName}'s Reservations`,
            reservations,
            user: req.session.user
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

// --- 7. GET Reservation Details ---
exports.getReservationDetails = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id)
            .populate('flightId')
            .lean();

        if (!reservation)
            return res.status(404).send('Reservation not found');

        res.render('reservations/reservation-details', {
            reservation,
            user: req.session.user
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching reservation details');
    }
};

// --- 8. POST Cancel Reservation ---
exports.cancelReservation = async (req, res) => {
    try {
        await Reservation.findByIdAndUpdate(req.params.id, { status: 'cancelled' });

        const userId = req.session.user._id;
        res.redirect(`/reservations?userId=${userId}`);

    } catch (err) {
        console.error(err);
        res.status(500).send('Error cancelling reservation');
    }
};