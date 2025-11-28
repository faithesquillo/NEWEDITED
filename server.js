const express = require('express');
const exphbs = require('express-handlebars');
const session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
const app = express();
console.log('Starting server setup.');

const authenticateRoutes = require('./routes/authenticateRoutes');
const flightsRoutes = require('./routes/flightsRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
//const userRoutes = require('./routes/userRoutes');
const checkInRoutes = require('./routes/checkInRoutes');
const User = require('./models/User');
const City = require('./models/City');
const Country = require('./models/Country');
const Flight = require('./models/Flight');

const availableCities = [
  { code: "MNL", name: "Manila, Philippines" },
  { code: "LAX", name: "Los Angeles, USA" },
  { code: "JFK", name: "New York, USA" },
  { code: "LHR", name: "London, UK" },
  { code: "CDG", name: "Paris, France" },
  { code: "NRT", name: "Tokyo, Japan" },
  { code: "SIN", name: "Singapore" },
  { code: "BKK", name: "Bangkok, Thailand" },
  { code: "DXB", name: "Dubai, UAE" },
  { code: "SYD", name: "Sydney, Australia" },
  { code: "IST", name: "Istanbul, Turkey" },
  { code: "FRA", name: "Frankfurt, Germany" },
  { code: "AMS", name: "Amsterdam, Netherlands" },
  { code: "HKG", name: "Hong Kong" },
  { code: "ICN", name: "Seoul, South Korea" },
  { code: "PEK", name: "Beijing, China" },
  { code: "SFO", name: "San Francisco, USA" },
  { code: "MIA", name: "Miami, USA" },
  { code: "ATH", name: "Athens, Greece" }
];

const exploreCountries = [
  { title: "Thailand", description: "Relax on the sandy beaches and enjoy the sunshine.", image_url: "https://cdn.pixabay.com/photo/2020/07/16/09/26/buddha-5410319_960_720.jpg" },
  { title: "Japan", description: "Experience the nightlife and culture of urban destinations.", image_url: "https://cdn.pixabay.com/photo/2019/07/14/08/08/night-4336403_1280.jpg" },
  { title: "Greece", description: "Hike through breathtaking mountain views and trails.", image_url: "https://cdn.pixabay.com/photo/2016/07/28/02/02/santorini-1546901_1280.jpg" },
  { title: "Turkey", description: "Savoring every moment in this beautiful crossroads of the world.", image_url: "https://cdn.pixabay.com/photo/2022/07/30/08/41/topkapi-palace-museum-7353338_1280.jpg" },
  { title: "England", description: "Tea, history, and a touch of royalty.", image_url: "https://cdn.pixabay.com/photo/2020/04/28/03/44/london-5102512_1280.jpg" },
  { title: "United States of America", description: "Where the horizon goes on forever and the colors never end.", image_url: "https://cdn.pixabay.com/photo/2016/12/15/07/54/horseshoe-bend-1908283_1280.jpg" }
];

const availableFlights = [
     { airline: 'BlueSky', aircraftType: 'A320', flightNumber: 'BS-401', origin: 'MNL', destination: 'LAX', departure: 'MNL 08:00', arrival: 'LAX 11:30', price: 250.00, date: 'daily', seatCapacity: 180 },
    { airline: 'SkyHigh', aircraftType: 'B737', flightNumber: 'SH-330', origin: 'MNL', destination: 'LAX', departure: 'MNL 16:00', arrival: 'LAX 19:30', price: 275.75, date: 'daily', seatCapacity: 160 },
    { airline: 'CloudNine', aircraftType: 'A330', flightNumber: 'CN-505', origin: 'MNL', destination: 'LAX', departure: 'MNL 06:00', arrival: 'LAX 09:30', price: 260.00, date: 'daily', seatCapacity: 240 },
    { airline: 'AeroWings', aircraftType: 'B787', flightNumber: 'AW-999', origin: 'MNL', destination: 'LAX', departure: 'MNL 18:30', arrival: 'LAX 22:00', price: 280.00, date: 'daily', seatCapacity: 250 },

    { airline: 'WorldFly', aircraftType: 'B777', flightNumber: 'WF-725', origin: 'MNL', destination: 'JFK', departure: 'MNL 10:30', arrival: 'JFK 13:00', price: 550.50, date: 'daily', seatCapacity: 300 },
    { airline: 'GlobalConnect', aircraftType: 'A350', flightNumber: 'GC-123', origin: 'MNL', destination: 'JFK', departure: 'MNL 23:00', arrival: 'JFK 02:30', price: 580.00, date: 'daily', seatCapacity: 320 },

    { airline: 'SkyBridge', aircraftType: 'A321', flightNumber: 'SB-202', origin: 'MNL', destination: 'MIA', departure: 'MNL 07:30', arrival: 'MIA 11:00', price: 520.00, date: 'daily', seatCapacity: 200 },
    { airline: 'PacificAir', aircraftType: 'A320', flightNumber: 'PA-344', origin: 'MNL', destination: 'SFO', departure: 'MNL 12:00', arrival: 'SFO 16:30', price: 310.00, date: 'daily', seatCapacity: 180 },

    { airline: 'FlyAway', aircraftType: 'B777', flightNumber: 'FA-210', origin: 'MNL', destination: 'LHR', departure: 'MNL 20:00', arrival: 'LHR 23:30', price: 620.00, date: 'daily', seatCapacity: 300 },
    { airline: 'AeroLink', aircraftType: 'A330', flightNumber: 'AL-789', origin: 'MNL', destination: 'LHR', departure: 'MNL 15:30', arrival: 'LHR 19:00', price: 600.50, date: 'daily', seatCapacity: 260 },

    { airline: 'EuroStar', aircraftType: 'A321', flightNumber: 'ES-667', origin: 'MNL', destination: 'CDG', departure: 'MNL 18:00', arrival: 'CDG 21:45', price: 640.00, date: 'daily', seatCapacity: 200 },
    { airline: 'FlightHub', aircraftType: 'B737', flightNumber: 'FH-112', origin: 'MNL', destination: 'CDG', departure: 'MNL 09:45', arrival: 'CDG 13:00', price: 650.00, date: 'daily', seatCapacity: 160 },

    { airline: 'Continental', aircraftType: 'A330', flightNumber: 'CT-445', origin: 'MNL', destination: 'FRA', departure: 'MNL 14:00', arrival: 'FRA 18:00', price: 630.00, date: 'daily', seatCapacity: 260 },
    { airline: 'AeroBridge', aircraftType: 'A320', flightNumber: 'AB-556', origin: 'MNL', destination: 'AMS', departure: 'MNL 16:30', arrival: 'AMS 20:15', price: 620.50, date: 'daily', seatCapacity: 180 },

    { airline: 'IstanblExpress', aircraftType: 'A320', flightNumber: 'IE-778', origin: 'MNL', destination: 'IST', departure: 'MNL 11:00', arrival: 'IST 15:30', price: 580.00, date: 'daily', seatCapacity: 180 },
    { airline: 'TurkishLink', aircraftType: 'A330', flightNumber: 'TL-889', origin: 'MNL', destination: 'IST', departure: 'MNL 19:00', arrival: 'IST 23:15', price: 590.00, date: 'daily', seatCapacity: 260 },

    { airline: 'GreeceFly', aircraftType: 'A320', flightNumber: 'GF-334', origin: 'MNL', destination: 'ATH', departure: 'MNL 13:30', arrival: 'ATH 17:45', price: 600.00, date: 'daily', seatCapacity: 180 },

    { airline: 'Air Global', aircraftType: 'B787', flightNumber: 'AG-112', origin: 'MNL', destination: 'NRT', departure: 'MNL 14:45', arrival: 'NRT 17:15', price: 150.99, date: 'daily', seatCapacity: 240 },
    { airline: 'StarFly', aircraftType: 'A320', flightNumber: 'SF-456', origin: 'MNL', destination: 'NRT', departure: 'MNL 09:15', arrival: 'NRT 12:45', price: 145.00, date: 'daily', seatCapacity: 180 },

    { airline: 'AsiaConnect', aircraftType: 'A321', flightNumber: 'AC-567', origin: 'MNL', destination: 'SIN', departure: 'MNL 08:30', arrival: 'SIN 10:15', price: 95.00, date: 'daily', seatCapacity: 200 },
    { airline: 'SingaporeAir', aircraftType: 'A350', flightNumber: 'SA-123', origin: 'MNL', destination: 'SIN', departure: 'MNL 18:00', arrival: 'SIN 19:45', price: 100.00, date: 'daily', seatCapacity: 320 },

    { airline: 'ThailandFly', aircraftType: 'A320', flightNumber: 'TF-678', origin: 'MNL', destination: 'BKK', departure: 'MNL 07:00', arrival: 'BKK 08:30', price: 110.00, date: 'daily', seatCapacity: 180 },
    { airline: 'SiamExpress', aircraftType: 'A321', flightNumber: 'SE-789', origin: 'MNL', destination: 'BKK', departure: 'MNL 16:00', arrival: 'BKK 17:30', price: 115.00, date: 'daily', seatCapacity: 200 },

    { airline: 'HongKongLink', aircraftType: 'A330', flightNumber: 'HK-890', origin: 'MNL', destination: 'HKG', departure: 'MNL 10:00', arrival: 'HKG 11:45', price: 120.00, date: 'daily', seatCapacity: 240 },
    { airline: 'Dragon Air', aircraftType: 'B737', flightNumber: 'DA-901', origin: 'MNL', destination: 'HKG', departure: 'MNL 19:30', arrival: 'HKG 21:15', price: 125.00, date: 'daily', seatCapacity: 160 },

    { airline: 'SeoulSky', aircraftType: 'B777', flightNumber: 'SS-345', origin: 'MNL', destination: 'ICN', departure: 'MNL 12:30', arrival: 'ICN 14:45', price: 140.00, date: 'daily', seatCapacity: 300 },
    { airline: 'KoreanFly', aircraftType: 'A330', flightNumber: 'KF-456', origin: 'MNL', destination: 'ICN', departure: 'MNL 20:00', arrival: 'ICN 22:15', price: 135.00, date: 'daily', seatCapacity: 260 },

    { airline: 'ChinaExpress', aircraftType: 'A330', flightNumber: 'CX-567', origin: 'MNL', destination: 'PEK', departure: 'MNL 11:00', arrival: 'PEK 13:30', price: 155.00, date: 'daily', seatCapacity: 260 },
    { airline: 'BeijingAir', aircraftType: 'B737', flightNumber: 'BA-678', origin: 'MNL', destination: 'PEK', departure: 'MNL 21:00', arrival: 'PEK 23:30', price: 160.00, date: 'daily', seatCapacity: 160 },

    { airline: 'JetStream', aircraftType: 'B777', flightNumber: 'JS-150', origin: 'MNL', destination: 'DXB', departure: 'MNL 22:15', arrival: 'DXB 01:45', price: 389.99, date: 'daily', seatCapacity: 300 },
    { airline: 'DubaiExpress', aircraftType: 'A380', flightNumber: 'DE-261', origin: 'MNL', destination: 'DXB', departure: 'MNL 13:00', arrival: 'DXB 16:30', price: 395.00, date: 'daily', seatCapacity: 500 },

    { airline: 'SunsetAir', aircraftType: 'A330', flightNumber: 'SA-808', origin: 'MNL', destination: 'SYD', departure: 'MNL 12:00', arrival: 'SYD 15:30', price: 290.00, date: 'daily', seatCapacity: 260 },
    { airline: 'AustralianFly', aircraftType: 'B787', flightNumber: 'AF-919', origin: 'MNL', destination: 'SYD', departure: 'MNL 20:30', arrival: 'SYD 23:45', price: 310.00, date: 'daily', seatCapacity: 240 },

    { airline: 'BlueSky', aircraftType: 'A320', flightNumber: 'BS-402', origin: 'LAX', destination: 'MNL', departure: 'LAX 09:00', arrival: 'MNL 14:30', price: 250.00, date: 'daily', seatCapacity: 180 },
    { airline: 'SkyHigh', aircraftType: 'B737', flightNumber: 'SH-331', origin: 'LAX', destination: 'MNL', departure: 'LAX 17:00', arrival: 'MNL 22:30', price: 275.75, date: 'daily', seatCapacity: 160 },

    { airline: 'WorldFly', aircraftType: 'B777', flightNumber: 'WF-726', origin: 'JFK', destination: 'MNL', departure: 'JFK 11:30', arrival: 'MNL 14:00', price: 550.50, date: 'daily', seatCapacity: 300 },

    { airline: 'Air Global', aircraftType: 'B787', flightNumber: 'AG-113', origin: 'NRT', destination: 'MNL', departure: 'NRT 15:45', arrival: 'MNL 18:15', price: 150.99, date: 'daily', seatCapacity: 240 },

    { airline: 'AsiaConnect', aircraftType: 'A321', flightNumber: 'AC-568', origin: 'SIN', destination: 'MNL', departure: 'SIN 11:00', arrival: 'MNL 12:45', price: 95.00, date: 'daily', seatCapacity: 200 },

    { airline: 'ThailandFly', aircraftType: 'A320', flightNumber: 'TF-679', origin: 'BKK', destination: 'MNL', departure: 'BKK 09:00', arrival: 'MNL 10:30', price: 110.00, date: 'daily', seatCapacity: 180 },

    { airline: 'JetStream', aircraftType: 'B777', flightNumber: 'JS-151', origin: 'DXB', destination: 'MNL', departure: 'DXB 03:00', arrival: 'MNL 08:30', price: 389.99, date: 'daily', seatCapacity: 300 },

    { airline: 'SunsetAir', aircraftType: 'A330', flightNumber: 'SA-809', origin: 'SYD', destination: 'MNL', departure: 'SYD 16:15', arrival: 'MNL 19:30', price: 290.00, date: 'daily', seatCapacity: 260 },

    { airline: 'GlobalFly', aircraftType: 'B777', flightNumber: 'GF-111', origin: 'LAX', destination: 'LHR', departure: 'LAX 10:00', arrival: 'LHR 01:30', price: 320.00, date: 'daily', seatCapacity: 300 },
    { airline: 'TransPacific', aircraftType: 'A350', flightNumber: 'TP-222', origin: 'LAX', destination: 'NRT', departure: 'LAX 12:00', arrival: 'NRT 15:30', price: 340.00, date: 'daily', seatCapacity: 320 },
    { airline: 'EuroAsia', aircraftType: 'A330', flightNumber: 'EA-333', origin: 'LHR', destination: 'DXB', departure: 'LHR 08:00', arrival: 'DXB 16:00', price: 450.00, date: 'daily', seatCapacity: 260 },
    { airline: 'AsianBridge', aircraftType: 'A321', flightNumber: 'AB-444', origin: 'SIN', destination: 'SYD', departure: 'SIN 14:00', arrival: 'SYD 18:45', price: 280.00, date: 'daily', seatCapacity: 200 }
];

mongoose.connect('mongodb://127.0.0.1:27017/flightApp')
  .then(async () => {
    console.log('MongoDB Connected');

    const adminExists = await User.findOne({ email: 'admin@gmail.com' });

    if (!adminExists) {
      await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@gmail.com',
        password: 'Admin123',
        role: 'Admin'
      });

      console.log('Default admin user created!');
    } else {
      console.log('Admin user already exists.');
    }

    const cityCount = await City.countDocuments();
    if (cityCount === 0) {
      await City.insertMany(availableCities);
      await Country.insertMany(exploreCountries);
      console.log(`Seeded ${availableCities.length} cities and ${exploreCountries.length} countries.`);
    } else {
        console.log(`Cities & Countries already exist (${cityCount} cities). Skipping seed.`);
    }


    const flightCount = await Flight.countDocuments();
    if (flightCount === 0) {
        
        
        const buildSchedule = (f) => {
            if (f.departure) {
                const parts = f.departure.split(' ');
                const time = parts.length > 1 ? parts[1] : null; 
                if (time) {
                    const [hh, mm] = time.split(':').map(Number);
                    const today = new Date();
                    today.setHours(hh, mm, 0, 0);
                    return today;
                }
            }
            return new Date(); 
        };

      const flightsToInsert = availableFlights.map(f => ({
        ...f,
        schedule: buildSchedule(f),
        seatsAvailable:f.seatCapacity,
      }));

      await Flight.insertMany(flightsToInsert);
      console.log(`Seeded ${flightsToInsert.length} available flights into database`);
    } else {
      console.log(`Flights already exist in database (${flightCount} flights)`);
    }

  })
  .catch(err => console.error('MongoDB connection error:', err));

console.log('Registering global middlewares.');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'shhhh',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false, 
        maxAge: 1000 * 60 * 60 * 24 
    }
}));
console.log('Session middleware initialized.');

app.use((req, res, next) => {
    console.log('Incoming request:', req.method, req.url);
    if (req.session.user) {
        res.locals.user = req.session.user;
        console.log('User logged in:', req.session.user.email);
    } else {
        res.locals.user = null;
        console.log('User is guest.');
    }
    next();
});

app.use('/static', express.static(path.join(__dirname, 'public')));
console.log('Static file serving enabled.');

app.engine('hbs', exphbs.engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true
  },
  helpers: {
    formatDate: (date) => new Date(date).toLocaleDateString(),
    formatTime: (date) =>
      new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    
    ifCond: function (v1, operator, v2, options) {
      switch (operator) {
        case '!=':
          return v1 != v2 ? options.fn(this) : options.inverse(this);
        default:
          return options.inverse(this);
      }
    },

    ifEquals: function (arg1, arg2, options) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    },

    json: function(context) {
      return JSON.stringify(context);
    }
  }
}));

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
console.log('Handlebars view engine configured.');

app.use('/', authenticateRoutes);
app.use('/flights', flightsRoutes);
app.use('/reservations', reservationRoutes);
//app.use('/users', userRoutes);
app.use('/', checkInRoutes);
console.log('All route handlers registered.');

app.get('/test', (req, res) => {
  console.log('Test route accessed. Sending response.');
  res.send('Server working');
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));