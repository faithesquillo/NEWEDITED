$(document).ready(function() {
    const ALL_FLIGHTS = [
        { airline: 'BlueSky', aircraftType: 'A320', flightNumber: 'BS-401', origin: 'MNL', destination: 'LAX', departure: 'MNL 08:00', arrival: 'LAX 11:30', price: 250.00, date: 'daily' },
        { airline: 'SkyHigh', aircraftType: 'B737', flightNumber: 'SH-330', origin: 'MNL', destination: 'LAX', departure: 'MNL 16:00', arrival: 'LAX 19:30', price: 275.75, date: 'daily' },
        { airline: 'CloudNine', aircraftType: 'A330', flightNumber: 'CN-505', origin: 'MNL', destination: 'LAX', departure: 'MNL 06:00', arrival: 'LAX 09:30', price: 260.00, date: 'daily' },
        { airline: 'AeroWings', aircraftType: 'B787', flightNumber: 'AW-999', origin: 'MNL', destination: 'LAX', departure: 'MNL 18:30', arrival: 'LAX 22:00', price: 280.00, date: 'daily' },
        { airline: 'WorldFly', aircraftType: 'B777', flightNumber: 'WF-725', origin: 'MNL', destination: 'JFK', departure: 'MNL 10:30', arrival: 'JFK 13:00', price: 550.50, date: 'daily' },
        { airline: 'GlobalConnect', aircraftType: 'A350', flightNumber: 'GC-123', origin: 'MNL', destination: 'JFK', departure: 'MNL 23:00', arrival: 'JFK 02:30', price: 580.00, date: 'daily' },
        { airline: 'SkyBridge', aircraftType: 'A321', flightNumber: 'SB-202', origin: 'MNL', destination: 'MIA', departure: 'MNL 07:30', arrival: 'MIA 11:00', price: 520.00, date: 'daily' },
        { airline: 'PacificAir', aircraftType: 'A320', flightNumber: 'PA-344', origin: 'MNL', destination: 'SFO', departure: 'MNL 12:00', arrival: 'SFO 16:30', price: 310.00, date: 'daily' },
        { airline: 'FlyAway', aircraftType: 'B777', flightNumber: 'FA-210', origin: 'MNL', destination: 'LHR', departure: 'MNL 20:00', arrival: 'LHR 23:30', price: 620.00, date: 'daily' },
        { airline: 'AeroLink', aircraftType: 'A330', flightNumber: 'AL-789', origin: 'MNL', destination: 'LHR', departure: 'MNL 15:30', arrival: 'LHR 19:00', price: 600.50, date: 'daily' },
        { airline: 'EuroStar', aircraftType: 'A321', flightNumber: 'ES-667', origin: 'MNL', destination: 'CDG', departure: 'MNL 18:00', arrival: 'CDG 21:45', price: 640.00, date: 'daily' },
        { airline: 'FlightHub', aircraftType: 'B737', flightNumber: 'FH-112', origin: 'MNL', destination: 'CDG', departure: 'MNL 09:45', arrival: 'CDG 13:00', price: 650.00, date: 'daily' },
        { airline: 'Continental', aircraftType: 'A330', flightNumber: 'CT-445', origin: 'MNL', destination: 'FRA', departure: 'MNL 14:00', arrival: 'FRA 18:00', price: 630.00, date: 'daily' },
        { airline: 'AeroBridge', aircraftType: 'A320', flightNumber: 'AB-556', origin: 'MNL', destination: 'AMS', departure: 'MNL 16:30', arrival: 'AMS 20:15', price: 620.50, date: 'daily' },
        { airline: 'IstanblExpress', aircraftType: 'A320', flightNumber: 'IE-778', origin: 'MNL', destination: 'IST', departure: 'MNL 11:00', arrival: 'IST 15:30', price: 580.00, date: 'daily' },
        { airline: 'TurkishLink', aircraftType: 'A330', flightNumber: 'TL-889', origin: 'MNL', destination: 'IST', departure: 'MNL 19:00', arrival: 'IST 23:15', price: 590.00, date: 'daily' },
        { airline: 'GreeceFly', aircraftType: 'A320', flightNumber: 'GF-334', origin: 'MNL', destination: 'ATH', departure: 'MNL 13:30', arrival: 'ATH 17:45', price: 600.00, date: 'daily' },
        { airline: 'Air Global', aircraftType: 'B787', flightNumber: 'AG-112', origin: 'MNL', destination: 'NRT', departure: 'MNL 14:45', arrival: 'NRT 17:15', price: 150.99, date: 'daily' },
        { airline: 'StarFly', aircraftType: 'A320', flightNumber: 'SF-456', origin: 'MNL', destination: 'NRT', departure: 'MNL 09:15', arrival: 'NRT 12:45', price: 145.00, date: 'daily' },
        { airline: 'AsiaConnect', aircraftType: 'A321', flightNumber: 'AC-567', origin: 'MNL', destination: 'SIN', departure: 'MNL 08:30', arrival: 'SIN 10:15', price: 95.00, date: 'daily' },
        { airline: 'SingaporeAir', aircraftType: 'A350', flightNumber: 'SA-123', origin: 'MNL', destination: 'SIN', departure: 'MNL 18:00', arrival: 'SIN 19:45', price: 100.00, date: 'daily' },
        { airline: 'ThailandFly', aircraftType: 'A320', flightNumber: 'TF-678', origin: 'MNL', destination: 'BKK', departure: 'MNL 07:00', arrival: 'BKK 08:30', price: 110.00, date: 'daily' },
        { airline: 'SiamExpress', aircraftType: 'A321', flightNumber: 'SE-789', origin: 'MNL', destination: 'BKK', departure: 'MNL 16:00', arrival: 'BKK 17:30', price: 115.00, date: 'daily' },
        { airline: 'HongKongLink', aircraftType: 'A330', flightNumber: 'HK-890', origin: 'MNL', destination: 'HKG', departure: 'MNL 10:00', arrival: 'HKG 11:45', price: 120.00, date: 'daily' },
        { airline: 'Dragon Air', aircraftType: 'B737', flightNumber: 'DA-901', origin: 'MNL', destination: 'HKG', departure: 'MNL 19:30', arrival: 'HKG 21:15', price: 125.00, date: 'daily' },
        { airline: 'SeoulSky', aircraftType: 'B777', flightNumber: 'SS-345', origin: 'MNL', destination: 'ICN', departure: 'MNL 12:30', arrival: 'ICN 14:45', price: 140.00, date: 'daily' },
        { airline: 'KoreanFly', aircraftType: 'A330', flightNumber: 'KF-456', origin: 'MNL', destination: 'ICN', departure: 'MNL 20:00', arrival: 'ICN 22:15', price: 135.00, date: 'daily' },
        { airline: 'ChinaExpress', aircraftType: 'A330', flightNumber: 'CX-567', origin: 'MNL', destination: 'PEK', departure: 'MNL 11:00', arrival: 'PEK 13:30', price: 155.00, date: 'daily' },
        { airline: 'BeijingAir', aircraftType: 'B737', flightNumber: 'BA-678', origin: 'MNL', destination: 'PEK', departure: 'MNL 21:00', arrival: 'PEK 23:30', price: 160.00, date: 'daily' },
        { airline: 'JetStream', aircraftType: 'B777', flightNumber: 'JS-150', origin: 'MNL', destination: 'DXB', departure: 'MNL 22:15', arrival: 'DXB 01:45', price: 389.99, date: 'daily' },
        { airline: 'DubaiExpress', aircraftType: 'A380', flightNumber: 'DE-261', origin: 'MNL', destination: 'DXB', departure: 'MNL 13:00', arrival: 'DXB 16:30', price: 395.00, date: 'daily' },
        { airline: 'SunsetAir', aircraftType: 'A330', flightNumber: 'SA-808', origin: 'MNL', destination: 'SYD', departure: 'MNL 12:00', arrival: 'SYD 15:30', price: 290.00, date: 'daily' },
        { airline: 'AustralianFly', aircraftType: 'B787', flightNumber: 'AF-919', origin: 'MNL', destination: 'SYD', departure: 'MNL 20:30', arrival: 'SYD 23:45', price: 310.00, date: 'daily' },
        { airline: 'BlueSky', aircraftType: 'A320', flightNumber: 'BS-402', origin: 'LAX', destination: 'MNL', departure: 'LAX 09:00', arrival: 'MNL 14:30', price: 250.00, date: 'daily' },
        { airline: 'SkyHigh', aircraftType: 'B737', flightNumber: 'SH-331', origin: 'LAX', destination: 'MNL', departure: 'LAX 17:00', arrival: 'MNL 22:30', price: 275.75, date: 'daily' },
        { airline: 'WorldFly', aircraftType: 'B777', flightNumber: 'WF-726', origin: 'JFK', destination: 'MNL', departure: 'JFK 11:30', arrival: 'MNL 14:00', price: 550.50, date: 'daily' },
        { airline: 'Air Global', aircraftType: 'B787', flightNumber: 'AG-113', origin: 'NRT', destination: 'MNL', departure: 'NRT 15:45', arrival: 'MNL 18:15', price: 150.99, date: 'daily' },
        { airline: 'AsiaConnect', aircraftType: 'A321', flightNumber: 'AC-568', origin: 'SIN', destination: 'MNL', departure: 'SIN 11:00', arrival: 'MNL 12:45', price: 95.00, date: 'daily' },
        { airline: 'ThailandFly', aircraftType: 'A320', flightNumber: 'TF-679', origin: 'BKK', destination: 'MNL', departure: 'BKK 09:00', arrival: 'MNL 10:30', price: 110.00, date: 'daily' },
        { airline: 'JetStream', aircraftType: 'B777', flightNumber: 'JS-151', origin: 'DXB', destination: 'MNL', departure: 'DXB 03:00', arrival: 'MNL 08:30', price: 389.99, date: 'daily' },
        { airline: 'SunsetAir', aircraftType: 'A330', flightNumber: 'SA-809', origin: 'SYD', destination: 'MNL', departure: 'SYD 16:15', arrival: 'MNL 19:30', price: 290.00, date: 'daily' },
        { airline: 'GlobalFly', aircraftType: 'B777', flightNumber: 'GF-111', origin: 'LAX', destination: 'LHR', departure: 'LAX 10:00', arrival: 'LHR 01:30', price: 320.00, date: 'daily' },
        { airline: 'TransPacific', aircraftType: 'A350', flightNumber: 'TP-222', origin: 'LAX', destination: 'NRT', departure: 'LAX 12:00', arrival: 'NRT 15:30', price: 340.00, date: 'daily' },
        { airline: 'EuroAsia', aircraftType: 'A330', flightNumber: 'EA-333', origin: 'LHR', destination: 'DXB', departure: 'LHR 08:00', arrival: 'DXB 16:00', price: 450.00, date: 'daily' },
        { airline: 'AsianBridge', aircraftType: 'A321', flightNumber: 'AB-444', origin: 'SIN', destination: 'SYD', departure: 'SIN 14:00', arrival: 'SYD 18:45', price: 280.00, date: 'daily' },
    ];

    function renderFlights(flights) {
        const $resultsContainer = $('#flightResults');
        $resultsContainer.empty();
        if (flights.length === 0) {
            $resultsContainer.append('<div class="col-12"><div class="alert alert-warning">No flights found.</div></div>');
            return;
        }
        flights.forEach(flight => {
            const flightCard = `
                <div class="col-md-6 col-lg-4">
                    <div class="card flight-card shadow-sm">
                        <div class="card-body row align-items-center">
                            <div class="col-8 flight-card-details">
                                <h5>${flight.airline} (${flight.flightNumber})</h5>
                                <p class="mb-1">
                                    <span class="badge text-bg-secondary">${flight.departure}</span> 
                                    &rarr; 
                                    <span class="badge text-bg-secondary">${flight.arrival}</span>
                                </p>
                                <p class="text-success fw-bold mb-0">Price: $${flight.price.toFixed(2)}</p>
                                <p class="mb-1"><small class="text-muted">Aircraft: ${flight.aircraftType || 'Not specified'}</small></p>
                            </div>
                                            <div class="col-4 text-end">
                                            <button class="btn btn-sm btn-success book-btn" 
                                                data-flight-number="${flight.flightNumber}">Book Now</button>
                                            </div>
                        </div>
                    </div>
                </div>
            `;
            $resultsContainer.append(flightCard);
        });
    }

    function assignAircraftTypes(flights) {
        const defaultByAirline = {
            'BlueSky': 'A320',
            'SkyHigh': 'B737',
            'CloudNine': 'A330',
            'AeroWings': 'B787',
            'WorldFly': 'B777',
            'GlobalConnect': 'A350',
            'SkyBridge': 'A321',
            'PacificAir': 'A320',
            'FlyAway': 'B777',
            'AeroLink': 'A330',
            'EuroStar': 'A321',
            'FlightHub': 'B737',
            'Continental': 'A330',
            'AeroBridge': 'A320',
            'IstanblExpress': 'A320',
            'TurkishLink': 'A330',
            'GreeceFly': 'A320',
            'Air Global': 'B787',
            'StarFly': 'A320',
            'AsiaConnect': 'A321',
            'SingaporeAir': 'A350',
            'ThailandFly': 'A320',
            'SiamExpress': 'A321',
            'HongKongLink': 'A330',
            'Dragon Air': 'B737',
            'SeoulSky': 'B777',
            'KoreanFly': 'A330',
            'ChinaExpress': 'A330',
            'BeijingAir': 'B737',
            'JetStream': 'B777',
            'DubaiExpress': 'A380',
            'SunsetAir': 'A330',
            'AustralianFly': 'B787',
            'GlobalFly': 'B777',
            'TransPacific': 'A350',
            'EuroAsia': 'A330',
            'AsianBridge': 'A321'
        };

        const fallback = ['A320','B737','A321','A330','B777','B787','A350'];

        flights.forEach(f => {
            if (!f.aircraftType || f.aircraftType === '') {
                if (f.airline && defaultByAirline[f.airline]) {
                    f.aircraftType = defaultByAirline[f.airline];
                } else {
                    const hash = (f.flightNumber || '').split('').reduce((s,c)=>s+c.charCodeAt(0), 0);
                    f.aircraftType = fallback[hash % fallback.length];
                }
            }
        });
    }

    assignAircraftTypes(ALL_FLIGHTS);
    
    function handleTripTypeChange() {
        const tripType = $('input[name="tripType"]:checked').attr('id');
        const $returnDateContainer = $('#returnDateContainer');
        const $returnDateInput = $('#returnDate');

        if (tripType === 'oneWay') {
            $returnDateContainer.addClass('d-none');
            $returnDateInput.prop('required', false);
        } else if (tripType === 'roundTrip') {
            $returnDateContainer.removeClass('d-none');
            $returnDateInput.prop('required', true);
        }
    }

    $('input[name="tripType"]').on('change', handleTripTypeChange);

    handleTripTypeChange();

    $('#flightSearchForm').on('submit', function(event) {
        event.preventDefault();
        
        const tripType = $('input[name="tripType"]:checked').attr('id');
        const origin = $('#origin').val();
        const destination = $('#destination').val();
        const departureDate = $('#departureDate').val();

        const adultsCount = parseInt($('#adultsCount').val(), 10);
        
        if (adultsCount < 1 || isNaN(adultsCount)) {
            $('#flightResults').html('<div class="col-12"><div class="alert alert-danger">You must select at least 1 adult passenger.</div></div>');
            $('html, body').animate({
                scrollTop: $('#flightResults').offset().top - 80
            }, 500);
            return; // stops submission
        }
        
        console.log(`Search: ${tripType} from ${origin} to ${destination} on ${departureDate}`);
        
        let outboundFlights = ALL_FLIGHTS.filter(flight => 
            flight.origin === origin && flight.destination === destination
        );
        
        if (outboundFlights.length === 0) {
            $('#flightResults').html('<div class="col-12"><div class="alert alert-warning">No flights found for your search criteria.</div></div>');
            $('html, body').animate({
                scrollTop: $('#flightResults').offset().top - 80
            }, 500);
            return;
        }
        
        renderFlights(outboundFlights);

        try {
            const departureDateInput = departureDate || new Date().toISOString().slice(0,10); // yyyy-mm-dd

            const flightsToSave = outboundFlights.map(f => {
                let timePart = '';
                if (f.departure && f.departure.indexOf(' ') >= 0) {
                    timePart = f.departure.split(' ')[1];
                }

                let scheduleIso = null;
                if (departureDateInput && timePart) {
                    scheduleIso = `${departureDateInput}T${timePart}:00`;
                }

                return {
                    flightNumber: f.flightNumber,
                    origin: f.origin,
                    destination: f.destination,
                    airline: f.airline,
                    price: Number(f.price) || 0,
                    schedule: scheduleIso,
                    aircraftType: f.aircraftType || f.aircraft || 'Not specified',
                    seatCapacity: f.seatCapacity || 100
                };
            });

            $.ajax({
                url: '/flights/save-search',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(flightsToSave),
                success: function(resp) {
                    console.log('Saved flights:', resp);
                },
                error: function(err) {
                    console.warn('Failed to save flights:', err);
                }
            });
        } catch (err) {
            console.warn('Error preparing flights to save', err);
        }
        
        $('html, body').animate({
            scrollTop: $('#flightResults').offset().top - 80
        }, 500);
    });
    
    $(document).on('click', '.book-btn', function(event) {
        event.preventDefault();
        
        const flightNumber = $(this).data('flight-number');
        const $flightCard = $(this).closest('.flight-card');
        
        const airline = $flightCard.find('h5').text().split('(')[0].trim();
        const departure = $flightCard.find('.badge').eq(0).text();
        const arrival = $flightCard.find('.badge').eq(1).text();
        const price = $flightCard.find('.text-success').text().match(/\$[\d.]+/)[0];
        
        const searchData = {
            origin: $('#origin').val(),
            destination: $('#destination').val(),
            departureDate: $('#departureDate').val(),
            returnDate: $('#returnDate').val(),
            tripType: $('input[name="tripType"]:checked').attr('id'),
            cabinClass: $('#cabinClass').val(),
            adultsCount: $('#adultsCount').val(), 
            childrenCount: $('#childrenCount').val(),
            infantsCount: $('#infantsCount').val(),
            flightNumber: flightNumber,
            airline: airline,
            departure: departure,
            arrival: arrival,
            price: price
        };
        
        window.location.href = `/reservations/book/${flightNumber}`;
    });
});


