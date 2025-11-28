const express = require('express');
const router = express.Router();

const Flight = require('../models/Flight');
const City = require('../models/City');
const Country = require('../models/Country');

const flightController = require('../controllers/flightController');
const authMiddleware = require('../middlewares/authMiddleware');


router.get('/', async(req, res) => {
    console.log('Accessing flights home.');
    try {
        const cities = await City.find().lean();
        const exploreCountries = await Country.find().lean();

        res.render('flights/searchPage', {
            cities: cities,
            exploreCountries: exploreCountries,
            pageTitle: 'Search Flights'
        });

    } catch (err) {
        console.error('Error loading flights search page:', err);
        res.status(500).send('Server Error');
    }
});

router.post('/',
    authMiddleware.isAdmin,
    (req, res, next) => {
        console.log('Admin adding new flight.');
        flightController.createFlight(req, res, next);
    }
);

router.get('/searchPage', async(req, res) => {
    console.log('Running flight search.');
    try {
        const { origin, destination } = req.query;

        const flights = await Flight.find({
            origin: origin,
            destination: destination
        }).lean();

        const cities = await City.find().lean();
        const exploreCountries = await Country.find().lean();
        console.log('Found', flights.length, 'matching flights.');


        res.render('flights/searchPage', {
            flights: flights,
            cities: cities,
            exploreCountries: exploreCountries,
            pageTitle: 'Search Results'
        });

    } catch (err) {
        console.error('Error running search query:', err);
        res.status(500).send('Server Error');
    }
});

router.get('/all',
    authMiddleware.isAdmin,
    (req, res, next) => {
        console.log('Admin listing all flights.');
        flightController.getAllFlights(req, res, next);
    }
);

router.get('/:id',
    authMiddleware.isAdmin,
    (req, res, next) => {
        console.log('Admin requested details for flight ID:', req.params.id);
        flightController.getFlightById(req, res, next);
    }
);

router.put('/:id',
    authMiddleware.isAdmin,
    (req, res, next) => {
        console.log('Admin updating flight ID:', req.params.id);
        flightController.updateFlight(req, res, next);
    }
);

router.post('/save-search',
    (req, res, next) => {
        console.log('Saving flight search results to database.');
        flightController.saveSearchResults(req, res, next);
    }
);

router.delete('/:id',
    authMiddleware.isAdmin,
    (req, res, next) => {
        console.log('Admin deleting flight ID:', req.params.id);
        flightController.deleteFlight(req, res, next);
    }
);

module.exports = router;