const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const { generateUniqueBP } = require('../utils/utils');

router.get('/checkin', (req, res) => {
    res.render('checkin/checkin'); 
});

router.post('/checkin', async (req, res) => {
    try {
        const { pnr, lastName } = req.body;

        if (!pnr || !lastName) {
            return res.status(400).json({
                success: false,
                message: "PNR and Last Name are required"
            });
        }

        // find the reservation
        const reservation = await Reservation.findOne({ pnr: pnr.toUpperCase() })
            .populate('flightId');

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: "Invalid PNR"
            });
        }

        // compare ln
        if (reservation.lastName.toLowerCase() !== lastName.toLowerCase()) {
            return res.status(401).json({
                success: false,
                message: "Last name does not match the reservation"
            });
        }

        // for date validation
        const now = new Date();
        const departureTime = new Date(reservation.flightId.schedule);

        if (now > departureTime) {
            return res.status(400).json({
                success: false,
                message: "Check-in failed: This flight has already departed."
            });
        }

        // check if already checked in
        if (reservation.checkedIn) {
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
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

module.exports = router;
