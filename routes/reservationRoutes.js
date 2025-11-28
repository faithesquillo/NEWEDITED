const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const Flight = require('../models/Flight');
const User = require('../models/User');

const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware');
const { generateUniquePNR } = require('../utils/utils'); 

const PREMIUM_ROWS = new Set([1, 2, 3, 4]);

router.get('/book/:flightNumber', isAuthenticated(), async(req, res) => {
    console.log('Accessing booking page for flight:', req.params.flightNumber);
    try {
        const flight = await Flight.findOne({ flightNumber: req.params.flightNumber }).lean();
        if (!flight) {
            console.log('Booking failed: Flight not found.');
            return res.status(404).send('Flight not found');
        }

        const activeReservations = await Reservation.find({
            flightId: flight._id,
            status: { $ne: 'cancelled' }
        }).select('seat.code');

        const occupiedSeats = activeReservations.map(r => r.seat.code);
        console.log('Found', occupiedSeats.length, 'occupied seats for flight:', flight.flightNumber);

        res.render('reservations/reservation', {
            flight: flight,
            pageTitle: 'Book Flight',
            occupiedSeats: JSON.stringify(occupiedSeats),
            user: req.session.user 
        });
    } catch (err) {
        console.error('Error loading booking page:', err);
        res.status(500).send('Server Error');
    }
});

router.post('/', async(req, res) => {
    console.log('Starting new reservation creation.');
    try {
        const {
            firstName,
            lastName,
            email,
            passport,
            seat,
            mealOption,
            baggage,
            flightId,
        } = req.body;

        if (!firstName || !lastName || !email || !passport || !seat || !flightId) {
            console.log('Reservation failed: Missing required fields.');
            return res.status(400).json({ message: 'Missing required fields.' });
        }

        const flight = await Flight.findById(flightId);
        if (!flight) {
            console.log('Reservation failed: Flight not found.');
            return res.status(404).json({ message: 'Flight not found.' });
        }

        const existingReservation = await Reservation.findOne({
            flightId: flightId,
            'seat.code': seat,
            status: { $ne: 'cancelled' }
        });

        if (existingReservation) {
            console.log('Reservation failed: Seat already booked.');
            return res.status(400).json({ message: `Seat ${seat} is already booked. Please choose another.` });
        }
        
        const pnr = await generateUniquePNR(); 

        const seatMatch = (typeof seat === 'string') ? seat.match(/^\d+/) : null;
        const seatRow = parseInt(seatMatch ? seatMatch[0] : '0', 10);
        const isPremiumSeat = PREMIUM_ROWS.has(seatRow);
        const mealLabel = (mealOption && mealOption.label) ? mealOption.label : 'None';
        const mealPrice = (mealOption && mealOption.price) ? Number(mealOption.price) : 0;

        const newReservation = new Reservation({
            flightId: flightId,
            userId: req.session.user?._id || null,
            firstName: firstName,
            lastName: lastName,
            email: email,
            passport: passport,
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
            pnr: pnr 
        });

        const savedReservation = await newReservation.save();
        console.log('Reservation created successfully. PNR:', pnr, 'Seat:', seat);
        res.status(201).json(savedReservation);

    } catch (error) {
        console.error('Reservation creation error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.get('/:id/edit', async(req, res) => {
    console.log('Accessing edit page for reservation ID:', req.params.id);
    try {
        const reservation = await Reservation.findById(req.params.id).populate('flightId').lean();
        if (!reservation) {
            console.log('Edit failed: Reservation not found.');
            return res.status(404).send('Reservation not found');
        }

        const otherReservations = await Reservation.find({
            flightId: reservation.flightId._id,
            status: { $ne: 'cancelled' },
            _id: { $ne: reservation._id }
        }).select('seat.code');

        console.log('Loaded edit form for PNR:', reservation.pnr);

         res.render('reservations/reservation-edit', {
        reservation,
        occupiedSeats: JSON.stringify(otherReservations.map(r => r.seat.code)),
        user: req.session.user 
    });

    } catch (err) {
        console.error('Error loading edit page:', err);
        res.status(500).send('Error loading edit page');
    }
});

router.put('/:id', async(req, res) => {
    console.log('Starting update for reservation ID:', req.params.id);
    try {
        const { id } = req.params;
        const { seat, mealOption, baggage } = req.body;

        const reservation = await Reservation.findById(id);
        if (!reservation) {
            console.log('Update failed: Reservation not found.');
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        if (seat && seat !== reservation.seat.code) {
            const existingReservation = await Reservation.findOne({
                flightId: reservation.flightId,
                'seat.code': seat,
                status: { $ne: 'cancelled' },
                _id: { $ne: id }
            });

            if (existingReservation) {
                console.log('Update failed: Requested seat is already booked.');
                return res.status(400).json({
                    success: false,
                    message: `Seat ${seat} is already booked. Please choose another.`
                });
            }
        }

        const oldTotal = reservation.bill.total;

        if (seat) {
            const seatMatch = (typeof seat === 'string') ? seat.match(/^\d+/) : null;
            const seatRow = parseInt(seatMatch ? seatMatch[0] : '0', 10);
            reservation.seat.code = seat;
            reservation.seat.isPremium = PREMIUM_ROWS.has(seatRow);
        }
        if (mealOption) {
            reservation.meal.label = (mealOption && mealOption.label) ? mealOption.label : 'None';
            reservation.meal.price = (mealOption && mealOption.price) ? Number(mealOption.price) : 0;
        }
        if (baggage !== undefined) {
            reservation.baggage.kg = parseInt(baggage, 10) || 0;
        }

        const updatedReservation = await reservation.save();

        const newTotal = updatedReservation.bill.total;
        const amountDue = Math.max(0, newTotal - oldTotal);

        console.log('Reservation updated successfully. New total:', newTotal);

        res.json({
            success: true,
            updatedReservation,
            amountDue: amountDue
        });

    } catch (error) {
        console.error('Reservation update error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

router.get('/', isAuthenticated(), async (req, res) => {
    console.log('Accessing reservations list.');
    try {
        const filter = {};
        if (req.session.user.role !== 'Admin') {
            filter.userId = req.session.user._id;
            console.log('Filtering list for current user.');
        } else {
            console.log('Admin accessing all reservations.');
        }

        const reservations = await Reservation.find(filter).populate('flightId').lean();
        console.log('Found', reservations.length, 'reservations to display.');
        res.render('reservations/reservation-list', { reservations, user: req.session.user });
    } catch (err) {
        console.error('Error fetching reservations list:', err);
        res.status(500).send('Error fetching reservations');
    }
});

router.get('/users/:userId/reservations', isAdmin, async (req, res) => {
    console.log('Admin accessing reservations for user ID:', req.params.userId);
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).send('User not found');

        const reservations = await Reservation.find({ userId: user._id }).populate('flightId').lean();
        console.log('Found', reservations.length, 'reservations for target user.');
        res.render('userReservations', { title: `${user.fullName}'s Reservations`, reservations, user: req.session.user }); 

    } catch (err) {
        console.error('Server error fetching user reservations:', err);
        res.status(500).send('Server error');
    }
});

router.get('/:id', async (req, res) => {
    console.log('Accessing details for reservation ID:', req.params.id);
    try {
        const reservation = await Reservation.findById(req.params.id).populate('flightId').lean();
        if (!reservation) return res.status(404).send('Reservation not found');

        console.log('Loaded details for PNR:', reservation.pnr);
        res.render('reservations/reservation-details', { 
            reservation, 
            user: req.session.user 
        });

    } catch (err) {
        console.error('Error fetching reservation details:', err);
        res.status(500).send('Error fetching reservation details');
    }
});

router.post('/:id/cancel', async(req, res) => {
    console.log('Cancelling reservation ID:', req.params.id);
    try {
        await Reservation.findByIdAndUpdate(req.params.id, { status: 'cancelled' });
        console.log('Reservation cancelled successfully.');
    
        res.redirect('/reservations');
    } catch (err) {
        console.error('Error cancelling reservation:', err);
        res.status(500).send('Error cancelling reservation');
    }
});

module.exports = router;