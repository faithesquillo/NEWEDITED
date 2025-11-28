const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const { generateUniqueBP } = require('../utils/utils');

router.get('/checkin', (req, res) => {
    console.log('Accessed check-in page.');
    res.render('checkin/checkin'); 
});

router.post('/api/checkin', async (req, res) => {
    try {
        const { pnr, lastName } = req.body;

        if (!pnr || !lastName) {
            console.log('Check-in failed: Missing fields.');
            return res.status(400).json({
                success: false,
                message: "PNR and Last Name are required"
            });
        }

        // find the reservation
        const reservation = await Reservation.findOne({ pnr: pnr.toUpperCase() })
            .populate('flightId');

        if (!reservation) {
            console.log('Check-in failed: Invalid PNR.');
            return res.status(404).json({
                success: false,
                message: "Invalid PNR"
            });
        }

        // compare ln
        if (reservation.lastName.toLowerCase() !== lastName.toLowerCase()) {
            console.log('Check-in failed: Last name mismatch.');
            return res.status(401).json({
                success: false,
                message: "Last name does not match the reservation"
            });
        }

        // for date validation
        const now = new Date();
        const departureTime = new Date(reservation.flightId.schedule);

        if (now > departureTime) {
            console.log('Check-in failed: Flight has already departed.');
            return res.status(400).json({
                success: false,
                message: "Check-in failed: This flight has already departed."
            });
        }

        // check if already checked in
        if (reservation.checkedIn) {
            console.log('Check-in attempt: Already checked in for PNR', pnr);
            return res.status(400).json({
                success: false,
                message: "Passenger is already checked in",
                boardingPass: reservation.boardingPassNo,
                seat: reservation.seat.code
            });
        }

        // generate bp no.
        const flightNumber = reservation.flightId.flightNumber;
        const boardingPass = await generateUniqueBP(flightNumber);

        // update reservation
        reservation.boardingPassNo = boardingPass;
        reservation.checkedIn = true;
        await reservation.save();

        console.log('Check-in successful for PNR:', pnr);

        return res.json({
            success: true,
            message: "Check-in successful!",
            pnr: reservation.pnr,
            passengerName: `${reservation.firstName} ${reservation.lastName}`,
            seat: reservation.seat.code,
            boardingPass: reservation.boardingPassNo
        });

    } catch (err) {
        console.error("Check-in error:", err);
        console.error('Server error during check-in process:', err);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});


module.exports = router;
