const vehicleModel = require('../models/vehicleModel.js');

const createVehicle = async (req, res, next) => {
    try {
        const { make, model, year, vin, plateNumber, chassisNumber, color } = req.body;
        const owner = req.user._id; // Assuming user is authenticated and user info is in req.user
        
        const existVin = await vehicleModel.findOne({ vin });
        if (existVin) {
            return res.status(400).json({ message: 'Invalid vin Number'})
        };

        const existChassis = await vehicleModel.findOne({ chassis });
        if (existChassis) {
            return res.status(400),json({ message: 'Invalid Chassis Number'})
        };

        const existPlateNumber = await vehicleModel.findOne({ plateNumber });
        if (existPlateNumber) {
            return res.status(400),json({ message: 'Invalid Plate Number'})
        };

        const newVehicle = new vehicleModel({
            make,
            model,
            year,
            vin,
            plateNumber,
            chassisNumber,
            color,
            owner
        });

        await newVehicle.save();
        res.status(201).json(newVehicle);

    } catch(error) {
        next(error);
        res.status(500).json({ error: 'Failed to create vehicle' });
    }
}

