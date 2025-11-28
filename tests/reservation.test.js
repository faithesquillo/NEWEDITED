const reservationController = require('../controllers/reservationController');
const Reservation = require('../models/Reservation');
const Flight = require('../models/Flight');
const utils = require('../utils/utils');

jest.mock('../models/Reservation');
jest.mock('../models/Flight');
jest.mock('../utils/utils');

describe('Reservation creation and cancellation', () => {

    const mockResponse = () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };

    beforeEach(() => {
        utils.generateUniquePNR.mockResolvedValue('MOCK-PNR');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('fail if required fields are missing', async() => {
        const req = { body: { firstName: 'John' } };
        const res = mockResponse();

        await reservationController.createReservation(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Missing required fields.'
        }));
    });

    it('fail if the flight does not exist', async() => {
        const req = {
            body: {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                passport: 'P1234567',
                seat: '1A',
                flightId: 'missing_flight_id',
                userId: 'user_123',
                baggage: 0,
                mealOption: { label: 'None', price: 0 }
            }
        };
        const res = mockResponse();

        Flight.findById.mockResolvedValue(null);

        await reservationController.createReservation(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Flight not found.'
        }));
    });

    it('fail if the seat is already booked', async() => {
        const req = {
            body: {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                passport: 'P1234567',
                seat: '1A',
                flightId: 'flight_123',
                userId: 'user_123',
                baggage: 0,
                mealOption: { label: 'None', price: 0 }
            }
        };
        const res = mockResponse();

        Flight.findById.mockResolvedValue({ _id: 'flight_123', price: 100 });

        Reservation.findOne.mockResolvedValue({ seat: { code: '1A' } });

        await reservationController.createReservation(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: expect.stringContaining('is already booked')
        }));
    });

    it('pass if user successfully booked a reservation', async() => {
        const req = {
            body: {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                passport: 'P1234567',
                seat: '1A',
                flightId: 'flight_123',
                userId: 'user_123',
                baggage: 10,
                mealOption: { label: 'Vegan', price: 20 }
            },
            session: { user: { _id: 'user_123' } }
        };
        const res = mockResponse();

        Flight.findById.mockResolvedValue({ _id: 'flight_123', price: 200, schedule: new Date(Date.now() + 86400000) });

        Reservation.findOne.mockResolvedValue(null);

        const mockSavedReservation = {
            ...req.body,
            seat: { code: '1A', isPremium: true },
            _id: 'res_new_123',
            pnr: 'MOCK-PNR'
        };

        const saveSpy = jest.fn().mockResolvedValue(mockSavedReservation);
        Reservation.mockImplementation(() => ({
            save: saveSpy
        }));

        await reservationController.createReservation(req, res);

        expect(utils.generateUniquePNR).toHaveBeenCalled();
        expect(saveSpy).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(mockSavedReservation);
    });

    it('pass if user successfully cancelled a reservation', async() => {
        const req = {
            params: { id: 'res_123' },
            query: { userId: 'user_123' },
            session: { user: { _id: 'user_123' } }
        };

        const res = {
            redirect: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };

        Reservation.findByIdAndUpdate.mockResolvedValue({ _id: 'res_123' });

        await reservationController.cancelReservation(req, res);

        expect(Reservation.findByIdAndUpdate).toHaveBeenCalledWith(
            'res_123', { status: 'cancelled' }
        );
        expect(res.redirect).toHaveBeenCalledWith('/reservations?userId=user_123');
    });

    it('fail if reservation to update is not found', async() => {
        const req = { params: { id: 'missing_id' }, body: {} };
        const res = mockResponse();

        Reservation.findById.mockResolvedValue(null);

        await reservationController.updateReservation(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Reservation not found'
        }));
    });

    it('pass if reservation has been successfully updated', async() => {
        const req = {
            params: { id: 'res_123' },
            body: { seat: '1A', baggage: 20 }
        };
        const res = mockResponse();

        const mockRes = {
            _id: 'res_123',
            flightId: 'flight_555',
            seat: { code: '10C', isPremium: false },

            baggage: { kg: 0 },
            meal: { label: 'None', price: 0 },

            bill: { total: 100 },
            save: jest.fn().mockResolvedValue({
                bill: { total: 130 },
                _id: 'res_123',
                baggage: { kg: 20 }
            })
        };

        Reservation.findById.mockResolvedValue(mockRes);

        Reservation.findOne.mockResolvedValue(null);

        await reservationController.updateReservation(req, res);

        expect(mockRes.save).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            amountDue: 30
        }));
    });
});