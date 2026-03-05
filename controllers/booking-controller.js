const { StatusCodes } = require('http-status-codes');
const { BookingService } = require('../services');
const { SuccessResponse, ErrorResponse } = require('../utils/common');
const inMemDb = {};
async function createBooking(req, res) {
    try {
        const response = await BookingService.createBooking({
            flightId: req.body.flightId,
            userId: req.body.userId,
            noOfSeats:req.body.noOfSeats
        });

        SuccessResponse.data = response;

        return res
            .status(StatusCodes.OK)
            .json(SuccessResponse);

    } catch (error) {
         console.log("Booking Error:", error);
        ErrorResponse.error = error;

        return res
            .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
            .json(ErrorResponse);
    }
}

async function makePayment(req, res) {
    try {
        const idempotencyKey = req.headers['x-idempotency-key'];

        // Check if idempotency key is missing
        if (!idempotencyKey) {
            return res
                .status(StatusCodes.BAD_REQUEST)
                .json({ message: 'Idempotency key missing' });
        }

        // Prevent retry if payment already processed
        if (inMemDb[idempotencyKey]) {
            return res
                .status(StatusCodes.BAD_REQUEST)
                .json({ message: 'Cannot retry on a successful Payment' });
        }

        const response = await BookingService.makePayment({
            totalCost: req.body.totalCost,
            userId: req.body.userId,
            bookingId: req.body.bookingId
        });

        // Store the key after successful payment
        inMemDb[idempotencyKey] = true;

        SuccessResponse.data = response;

        return res
            .status(StatusCodes.OK)
            .json(SuccessResponse);

    } catch (error) {
        ErrorResponse.error = error;

        return res
            .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
            .json(ErrorResponse);
    }
}

module.exports = {
    createBooking,
     makePayment

};