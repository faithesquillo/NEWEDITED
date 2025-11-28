const Flight = require('../models/Flight');

exports.createFlight = async (req, res) => {
    try {
        const payload = { ...req.body };

        if (payload.seatCapacity !== undefined) {
            payload.seatCapacity = Number(payload.seatCapacity);
            if (Number.isNaN(payload.seatCapacity) || payload.seatCapacity < 1) {
                console.log('Flight creation failed: Invalid capacity.');
                return res.status(400).json({
                    success: false,
                    message: 'Seat capacity must be a positive number.'
                });
            }
        }

        if (payload.seatsAvailable !== undefined) {
            payload.seatsAvailable = Number(payload.seatsAvailable);
            if (Number.isNaN(payload.seatsAvailable) || payload.seatsAvailable < 0) {
                console.log('Flight creation failed: Invalid seats available count.');
                return res.status(400).json({
                    success: false,
                    message: 'Seats available must be zero or a positive number.'
                });
            }
        }

        if (payload.price !== undefined) {
            payload.price = Number(payload.price);
            if (Number.isNaN(payload.price) || payload.price < 0) {
                console.log('Flight creation failed: Invalid price.');
                return res.status(400).json({
                    success: false,
                    message: 'Price must be a non-negative number.'
                });
            }
        }

        // ensure seatsAvailable defaults to seatCapacity when not provided
        if (payload.seatsAvailable === undefined || payload.seatsAvailable === null) {
            payload.seatsAvailable = payload.seatCapacity;
        }

        if (payload.seatCapacity !== undefined && payload.seatsAvailable !== undefined) {
            if (Number(payload.seatsAvailable) > Number(payload.seatCapacity)) {
                console.log('Flight creation failed: Seats available exceeds capacity.');
                return res.status(400).json({
                    success: false,
                    message: 'Seats available cannot exceed seat capacity.'
                });
            }
        }

        // create a new flight doc using data from req body
        const newFlight = await Flight.create(payload);

        console.log('New Flight created:', newFlight.flightNumber, 'Route:', newFlight.origin, '->', newFlight.destination);
        
        return res.status(201).json({
            success: true,
            message: 'Flight created successfully.',
            data: newFlight
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            console.error('Flight creation validation error:', error.message);
            return res.status(400).json({
                success: false, 
                message: error.message
            });
        }
        if (error.code === 11000) {
            console.log('Flight creation failed: Duplicate flight number.');
            return res.status(400).json({
                success: false,
                message: 'Duplicate key error: Flight number already exists.'
            });
        }
        console.error('Server error during flight creation:', error);
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
        console.log('Received', flights.length, 'flights to save/update.');

        if (!Array.isArray(flights) || flights.length === 0) {
            console.log('No flights provided to save.');
            return res.status(400).json({ success: false, message: 'No flights provided to save.' });
        }

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

        console.log('Flights saved/updated. Upserted:', result.upsertedCount, 'Modified:', result.modifiedCount);

        return res.status(200).json({
            success: true,
            message: 'Flights saved/updated successfully.',
            result
        });

    } catch (error) {
        console.error('Server error while saving flights:', error);
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
        console.log('Fetched', flights.length, 'flights from database.');

        return res.status(200).json({
            success: true,
            count: flights.length,
            data: flights
        });
    } catch (error) {
        console.error('Server error while fetching flights:', error);
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
            console.log('Flight not found with ID:', req.params.id);
            return res.status(404).json({
                success: false, 
                message: `Flight not found with ID: ${req.params.id}`
            });
        }

        console.log('Flight details fetched for', flight.flightNumber);
        
        // success response
        return res.status(200).json({
            success:true,
            data: flight
        });

    } catch (error) {
        if (error.kind === 'ObjectId') {
            console.log('Flight not found (invalid ID format):', req.params.id);
            return res.status(404).json({
                success: false,
                message: 'Flight not found (invalid Id format).'
            });
        }

        console.error('Server error while fetching flight:', error);

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
                console.log('Flight update failed: Invalid price.');
                return res.status(400).json({
                    success: false,
                    message: 'Price must be a non-negative number.'
                });
            }
        }

        if (req.body.seatCapacity !== undefined) {
            req.body.seatCapacity = Number(req.body.seatCapacity);
            if (Number.isNaN(req.body.seatCapacity) || req.body.seatCapacity < 1) {
                console.log('Flight update failed: Invalid seat capacity.');
                return res.status(400).json({
                    success: false,
                    message: 'Seat capacity must be a positive number.'
                });
            }
        }

        if (req.body.seatsAvailable !== undefined) {
            req.body.seatsAvailable = Number(req.body.seatsAvailable);
            if (Number.isNaN(req.body.seatsAvailable) || req.body.seatsAvailable < 0) {
                console.log('Flight update failed: Invalid seats available.');
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
                console.log('Flight update failed: Seats available exceeds capacity.');
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
            new: true, 
            runValidators: true 
        });

        if (!flight) {
            console.log('Flight update failed: ID not found.');
            return res.status(404).json({
                success: false,
                message: `Flight not found with Id: ${req.params.id}`
            });

        }
        
        console.log('Flight updated:', flight.flightNumber, 'ID:', flight._id);

        return res.status(200).json({
            success: true, 
            message: 'Flight updated successfully.',
            data: flight
        });
    } catch (error) {
        if (error.name === 'ValidationError' || error.code === 11000) {
            console.error('Flight update validation/duplicate error:', error);
            return res.status(400).json({
                success:false,
                message: error.message.includes('11000') ? 
                'Duplicate key error: Flight number already exists.' : error.message
            });

        }

        console.error('Server error during flight update:', error);

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
            console.log('Flight deletion failed: ID not found.');
            return res.status(404).json({
                success: false,
                message: `Flight not found with ID: ${req.params.id}`
            });

        }
        
        console.log('Flight deleted: ID', req.params.id);

        return res.status(200).json({
            success: true,
            message: 'Flight deleted successfully.'
        });

    } catch (error) {
        console.error('Server error during flight deletion:', error);

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
            console.log('Check flight saved failed: Missing flight number.');
            return res.status(400).json({ success: false, message: 'flightNumber is required in params.' });
        }

        const flight = await Flight.findOne({ flightNumber: flightNumber });
        
        console.log('Check flight saved result for', flightNumber, ':', !!flight ? 'found' : 'not found');

        return res.status(200).json({
            success: true,
            saved: !!flight,
            data: flight || null
        });
    } catch (error) {
        console.error('Server error while checking flight saved status:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while checking flight.',
            error: error.message
        });
    }

};