const express = require('express');
const router = express.Router();

const Flight = require('../models/Flight');
const City = require('../models/City');
const Country = require('../models/Country');

const flightController = require('../controllers/flightController');
const authMiddleware = require('../middlewares/authMiddleware');


router.get('/', async(req, res) => {
    try {
        const cities = await City.find().lean();
        const exploreCountries = await Country.find().lean();

        res.render('flights/searchPage', {
            cities: cities,
            exploreCountries: exploreCountries,
            pageTitle: 'Search Flights'
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.post('/',
    authMiddleware.isAdmin,
    flightController.createFlight
);

router.get('/searchPage', async(req, res) => {
    try {
        const { origin, destination } = req.query;

        const flights = await Flight.find({
            origin: origin,
            destination: destination
        }).lean();

        const cities = await City.find().lean();
        const exploreCountries = await Country.find().lean();

        res.render('flights/searchPage', {
            flights: flights,
            cities: cities,
            exploreCountries: exploreCountries,
            pageTitle: 'Search Results'
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.get('/all',
    authMiddleware.isAdmin,
    flightController.getAllFlights
);

router.get('/:id',
    authMiddleware.isAdmin,
    flightController.getFlightById
);

router.put('/:id',
    authMiddleware.isAdmin,
    flightController.updateFlight
);

router.post('/save-search',
    flightController.saveSearchResults
);

router.delete('/:id',
    authMiddleware.isAdmin,
    flightController.deleteFlight
);

module.exports = router;

