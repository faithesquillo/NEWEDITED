const Reservation = require('../models/Reservation');
const Flight = require('../models/Flight');
const User = require('../models/User');
const { generateUniquePNR } = require('../utils/utils');

const PREMIUM_ROWS = new Set([1, 2, 3, 4]);

exports.getBookingForm = async (req, res) => {
    try {
        const flight = await Flight.findOne({ flightNumber: req.params.flightNumber }).lean();
        if (!flight) return res.status(404).send('Flight not found');

        const now = new Date();
        if (new Date(flight.schedule) < now) {
            console.log('Booking closed: flight departed.');
            return res.status(400).send('Booking is closed: This flight has already departed or is scheduled for a past date.');
        }

        const activeReservations = await Reservation.find({
            flightId: flight._id,
            status: { $ne: 'cancelled' }
        }).select('seat.code');

        const occupiedSeats = activeReservations.map(r => r.seat.code);
        console.log('Loading booking form for flight:', flight.flightNumber, 'Occupied seats:', occupiedSeats.length);

        res.render('reservations/reservation', {
            flight,
            pageTitle: 'Book Flight',
            occupiedSeats: JSON.stringify(occupiedSeats),
            user: req.session.user
        });
    } catch (err) {
        console.error('Error loading booking form:', err);
        res.status(500).send('Server Error');
    }
};

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
        const userId = req.session.user?._id || 'GUEST';

        if (!firstName || !lastName || !email || !passport || !seat || !flightId) {
            console.log('User failed to create reservation: Missing required fields.');
            return res.status(400).json({ message: 'Missing required fields.' });
        }

        const flight = await Flight.findById(flightId);
        if (!flight) {
            console.log('User failed to create reservation: Flight ID not found.');
            return res.status(404).json({ message: 'Flight not found.' });
        }

        // for the dates validation
        const now = new Date();
        if (new Date(flight.schedule) < now) {
            console.log('Reservation failed: flight already departed.');
            return res.status(400).json({ message: 'Booking failed: This flight has already departed.' });
        }
        
        const existingReservation = await Reservation.findOne({
            flightId,
            'seat.code': seat,
            status: { $ne: 'cancelled' }
        });

        if (existingReservation) {
            console.log('Reservation failed: Seat already booked.');
            return res.status(400).json({ message: `Seat ${seat} is already booked.` });
        }

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
        console.log('New Reservation created. PNR:', pnr, 'Flight:', flight.flightNumber, 'User ID:', userId);
        res.status(201).json(savedReservation);
    } catch (error) {
        console.error('Reservation creation error:', error);

        if (error.code === 11000) {
             console.log('Seat booking conflict detected:', req.body.seat);
             return res.status(400).json({ 
                 success:false,
                 message: `Seat ${req.body.seat} is already booked. A race condition was detected. Please choose another seat.`, 
                 error: error.message 
             });
         }

        console.error('Server error during reservation creation:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getEditForm = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id)
            .populate('flightId')
            .lean();

        if (!reservation) return res.status(404).send('Reservation not found');
        console.log('Loading edit form for PNR:', reservation.pnr);

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
        console.error('Error loading reservation edit page:', err);
        res.status(500).send('Error loading edit page');
    }
};

exports.updateReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const { seat, mealOption, baggage } = req.body;
        const userId = req.session.user?._id || 'UNKNOWN';

        const reservation = await Reservation.findById(id);
        if (!reservation) {
            console.log('Reservation update failed: ID not found.');
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        if (seat && seat !== reservation.seat.code) {
            const existingReservation = await Reservation.findOne({
                flightId: reservation.flightId,
                'seat.code': seat,
                status: { $ne: 'cancelled' },
                _id: { $ne: id }
            });

            if (existingReservation) {
                console.log('Reservation update failed: Seat already booked.');
                return res.status(400).json({
                    success: false,
                    message: `Seat ${seat} is already booked.`
                });
            }
        }

        const oldTotal = reservation.bill.total;

        if (seat) {
            const seatRow = parseInt((seat.match(/^\d+/) || ['0'])[0], 10);
            reservation.seat.code = seat;
            reservation.seat.isPremium = PREMIUM_ROWS.has(seatRow);
            console.log('PNR', reservation.pnr, 'changed seat to', seat);
        }

        if (mealOption) {
            reservation.meal.label = mealOption?.label || 'None';
            reservation.meal.price = Number(mealOption?.price || 0);
            console.log('PNR', reservation.pnr, 'changed meal to', reservation.meal.label);
        }

        reservation.baggage.kg = parseInt(baggage, 10) || 0;
        console.log('PNR', reservation.pnr, 'changed baggage to', reservation.baggage.kg, 'kg');

        const updatedReservation = await reservation.save();
        const newTotal = updatedReservation.bill.total;
        const amountDue = Math.max(0, newTotal - oldTotal);

        console.log('Reservation updated. PNR:', reservation.pnr, 'Amount Due:', amountDue.toFixed(2));

        res.json({
            success: true,
            updatedReservation,
            amountDue
        });

    } catch (error) {
        console.error('Reservation update error:', error);
        console.error('Server error during reservation update for ID:', req.params.id, error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

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

exports.cancelReservation = async (req, res) => {
    try {
        const result = await Reservation.findByIdAndUpdate(req.params.id, { status: 'cancelled' });
        
        if (result) {
            console.log('Reservation cancelled. ID:', req.params.id, 'PNR:', result.pnr);
        } else {
            console.log('Attempted to cancel non-existent reservation ID:', req.params.id);
        }

        const userId = req.session.user._id;
        res.redirect('/reservations');

    } catch (err) {
        console.error('Error cancelling reservation:', err);
        res.status(500).send('Error cancelling reservation');
    }

};
