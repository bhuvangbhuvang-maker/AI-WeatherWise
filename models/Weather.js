const mongoose = require("mongoose");

const weatherSchema = new mongoose.Schema({

    city: {
        type: String,
        required: true
    },

    temperature: Number,

    feels_like: Number,

    humidity: Number,

    condition: String,

    wind_speed: Number,

    searchedAt: {
        type: Date,
        default: Date.now
    }

});

module.exports =
    mongoose.model(
        "Weather",
        weatherSchema
    );