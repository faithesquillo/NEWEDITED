const request = require('supertest');
const express = require('express');
const flightRoutes = require('../routes/flightsRoutes');
const Flight = require('../models/Flight');

jest.mock('../middlewares/authMiddleware', () => ({
    isAdmin: (req, res, next) => {
        req.user = { _id: 'mock_admin_id', role: 'Admin' };
        next();
    },
    requireLogin: (req, res, next) => {
        req.user = { _id: 'mock_user_id', role: 'User' };
        next();
    }
}));

const app = express();
app.use(express.json());
app.use('/flights', flightRoutes);

jest.mock('../models/Flight');

describe('Flight creation (admin)', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('pass if admin can create a flight', async() => {
        const newFlightData = {
            flightNumber: 'TEST-999',
            origin: 'JFK',
            destination: 'LHR',
            price: 500,
            seatCapacity: 100,
            airline: 'Test Air',
            schedule: new Date().toISOString()
        };

        Flight.create.mockResolvedValue({
            ...newFlightData,
            _id: 'mock_flight_id',
            seatsAvailable: 100
        });

        const response = await request(app)
            .post('/flights')
            .send(newFlightData);

        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);
    });

    it('fail if admin made an invalid input for flight creation', async() => {
        const badFlightData = {
            flightNumber: 'BAD-1',
            price: -50
        };

        const response = await request(app)
            .post('/flights')
            .send(badFlightData);

        expect(response.statusCode).toBe(400);
    });

    it('fail if seatsAvailable exceeds seatCapacity', async() => {
        const illogicalData = {
            flightNumber: 'TEST-999',
            origin: 'JFK',
            destination: 'LHR',
            price: 500,
            seatCapacity: 100,
            seatsAvailable: 200,
            airline: 'Test Air',
            schedule: new Date().toISOString()
        };

        const response = await request(app)
            .post('/flights')
            .send(illogicalData);

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe('Seats available cannot exceed seat capacity.');
    });

    it('fail if flight number already exists', async() => {
        const duplicateData = {
            flightNumber: 'EXISTING-101',
            origin: 'JFK',
            destination: 'LHR',
            price: 500,
            seatCapacity: 100,
            airline: 'Test Air',
            schedule: new Date().toISOString()
        };

        const duplicateError = new Error('Duplicate key');
        duplicateError.code = 11000;
        Flight.create.mockRejectedValue(duplicateError);

        const response = await request(app)
            .post('/flights')
            .send(duplicateData);

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toMatch(/already exists/);
    });
});