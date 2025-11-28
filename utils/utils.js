const Reservation = require('../models/Reservation');

// PNR generation helper functions
function generatePNR(){

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let pnr = '';
    
    for (let i = 0; i < 6; i++) {
        pnr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return pnr;
}

async function generateUniquePNR(){
    
    let pnr = '';
    let exists = true;

    while (exists){
        pnr = generatePNR();

        exists = await Reservation.findOne({ pnr: pnr });
    }

    return pnr;
}


// boarding pass number generation helper functions
function generateBoardingPass(flightNumber) {
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    return `BP-${flightNumber}-${randomDigits}`;
}

async function generateUniqueBP(flightNumber) {
    let bp = "";
    let exists = true;

    while (exists) {
        bp = generateBoardingPass(flightNumber);
        exists = await Reservation.findOne({ boardingPassNo: bp });
    }

    return bp;
}

module.exports = {
    generateUniquePNR,
    generateUniqueBP
};