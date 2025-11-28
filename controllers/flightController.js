const Flight = require('../models/Flight');

exports.createFlight = async (req, res) => {
    try {
        const payload = { ...req.body };

        if (payload.seatCapacity !== undefined) {
            payload.seatCapacity = Number(payload.seatCapacity);
            if (Number.isNaN(payload.seatCapacity) || payload.seatCapacity < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Seat capacity must be a positive number.'
                });
            }
        }

        if (payload.seatsAvailable !== undefined) {
            payload.seatsAvailable = Number(payload.seatsAvailable);
            if (Number.isNaN(payload.seatsAvailable) || payload.seatsAvailable < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Seats available must be zero or a positive number.'
                });
            }
        }

        if (payload.price !== undefined) {
            payload.price = Number(payload.price);
            if (Number.isNaN(payload.price) || payload.price < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Price must be a non-negative number.'
                });
            }
        }

        // Ensure seatsAvailable defaults to seatCapacity when not provided
        if (payload.seatsAvailable === undefined || payload.seatsAvailable === null) {
            payload.seatsAvailable = payload.seatCapacity;
        }

        if (payload.seatCapacity !== undefined && payload.seatsAvailable !== undefined) {
            if (Number(payload.seatsAvailable) > Number(payload.seatCapacity)) {
                return res.status(400).json({
                    success: false,
                    message: 'Seats available cannot exceed seat capacity.'
                });
            }
        }

        // this will create a new flight doc using data from req body
        const newFlight = await Flight.create(payload);

        // success
        return res.status(201).json({
            success: true,
            message: 'Flight created successfully.',
            data: newFlight
        });
    } catch (error) {
        // to handle validation errors (e.g. missing required fields, unique constraint violations)
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false, 
                message: error.message
            });
        }

        // for the duplicate key error (flightNumber unique constraint)
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Duplicate key error: Flight number already exists.'
            });
        }

        // for gen server error
        return res.status(500).json({
            success: false,
            message: 'Server error during flight creation.',
            error: error.message
        });
    
    
    }   
};

exports.saveSearchResults = async (req, res) => {
    try {
        const flights = Array.isArray(req.body) ? req.body : req.body.flights;

        if (!Array.isArray(flights) || flights.length === 0) {
            return res.status(400).json({ success: false, message: 'No flights provided to save.' });
        }

        // Build bulk operations to upsert by flightNumber to avoid duplicates
        const ops = flights.map(f => {
            const update = {
                flightNumber: f.flightNumber,
                origin: f.origin,
                destination: f.destination,
                price: f.price,
                airline: f.airline,
                aircraftType: f.aircraftType || f.aircraft || 'Not specified',
                seatCapacity: f.seatCapacity || f.capacity || 100
            };

            // if schedule provided as ISO string or Date, include it
            if (f.schedule) update.schedule = new Date(f.schedule);

            return {
                updateOne: {
                    filter: { flightNumber: update.flightNumber },
                    update: { $set: update },
                    upsert: true
                }
            };
        });

        const result = await Flight.bulkWrite(ops, { ordered: false });

        return res.status(200).json({
            success: true,
            message: 'Flights saved/updated successfully.',
            result
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Server error while saving flights.',
            error: error.message
        });
    }
};

exports.getAllFlights = async (req, res) => {
    try {
        const flights = await Flight.find().sort({ schedule: 1});

        return res.status(200).json({
            success: true,
            count: flights.length,
            data: flights
        });
    } catch (error) {
        // gen server error
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching flights.',
            error: error.message
        });
    }
};

exports.getFlightById = async (req, res) => {
    try {
        // get id from route params
        const flight = await Flight.findById(req.params.id);

        if (!flight) {
            return res.status(404).json({
                success: false, 
                message: `Flight not found with ID: ${req.params.id}`
            });
        }

        // success response
        return res.status(200).json({
            success:true,
            data: flight
        });

    } catch (error) {
        // for handling invalid id formats
        if (error.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                message: 'Flight not found (invalid Id format).'
            });
        }

        // gen server error
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching flight.',
            error: error.message
        });

    }
};

exports.updateFlight = async (req, res) => {
    try {
        if (req.body.price !== undefined) {
            req.body.price = Number(req.body.price);
            if (Number.isNaN(req.body.price) || req.body.price < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Price must be a non-negative number.'
                });
            }
        }

        if (req.body.seatCapacity !== undefined) {
            req.body.seatCapacity = Number(req.body.seatCapacity);
            if (Number.isNaN(req.body.seatCapacity) || req.body.seatCapacity < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Seat capacity must be a positive number.'
                });
            }
        }

        if (req.body.seatsAvailable !== undefined) {
            req.body.seatsAvailable = Number(req.body.seatsAvailable);
            if (Number.isNaN(req.body.seatsAvailable) || req.body.seatsAvailable < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Seats available must be zero or a positive number.'
                });
            }
        }

        const seatCapacity = req.body.seatCapacity;
        const seatsAvailable = req.body.seatsAvailable;

        if (seatCapacity !== undefined && seatsAvailable !== undefined) {
            if (Number(seatsAvailable) > Number(seatCapacity)) {
                return res.status(400).json({
                    success: false,
                    message: 'Seats available cannot exceed seat capacity.'
                });
            }
        }

        if (seatCapacity !== undefined && seatsAvailable === undefined) {
            req.body.seatsAvailable = seatCapacity;
        }

        const flight = await Flight.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // returns new doc instead of old
            runValidators: true // reruns mongoose validation on update
        });

        if (!flight) {
            return res.status(404).json({
                success: false,
                message: `Flight not found with Id: ${req.params.id}`
            });

        }

        // success response
        return res.status(200).json({
            success: true, 
            message: 'Flight updated successfully.',
            data: flight
        });
    } catch (error) {
        // will handle validation error or dup key error during updates
        if (error.name === 'ValidationError' || error.code === 11000) {
            return res.status(400).json({
                success:false,
                message: error.message.includes('11000') ? 
                'Duplicate key error: Flight number already exists.' : error.message
            });

        }

        // for gen server errors
        return res.status(500).json({
            success: false,
            message: 'Server error during flight update.',
            error: error.message
        });
    }
};

exports.deleteFlight = async (req, res) => {
    try {
        const flight = await Flight.findByIdAndDelete(req.params.id);
    
        if (!flight) {
            return res.status(404).json({
                success: false,
                message: `Flight not found with ID: ${req.params.id}`
            });

        }

        return res.status(200).json({
            success: true,
            message: 'Flight deleted successfully.'
        });

    } catch (error) {
        // gen server error
        return res.status(500).json({
            success: false,
            message: 'Server error during flight deletion.',
            error: error.message
        });
    }
};

exports.checkFlightSaved = async (req, res) => {
    try {
        const flightNumber = req.params.flightNumber;

        if (!flightNumber) {
            return res.status(400).json({ success: false, message: 'flightNumber is required in params.' });
        }

        const flight = await Flight.findOne({ flightNumber: flightNumber });

        return res.status(200).json({
            success: true,
            saved: !!flight,
            data: flight || null
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Server error while checking flight.',
            error: error.message
        });
    }

};
