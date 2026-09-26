require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
require("dotenv").config();

const path = require("path");
const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const Weather = require("./models/Weather");

const app = express();

app.use(express.json());


// =========================
// SERVE FRONTEND
// =========================

app.use(
    express.static(
        path.join(__dirname, "frontend")
    )
);


// =========================
// ENVIRONMENT CHECK
// =========================

console.log(
    "Weather API key loaded:",
    !!process.env.OPENWEATHER_API_KEY
);


// =========================
// MONGODB CONNECTION
// =========================

mongoose.connect(process.env.MONGODB_URI)

    .then(() => {

        console.log(
            "MongoDB connected successfully"
        );

    })

    .catch((error) => {

        console.log(
            "MongoDB connection error:",
            error.message
        );

    });


// =========================
// HOME PAGE
// =========================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "frontend",
            "index.html"
        )
    );

});


// =========================
// CURRENT WEATHER
// =========================

app.get(
    "/api/weather/:city",
    async (req, res) => {

        try {

            const city =
                req.params.city;


            const response =
                await axios.get(
                    "https://api.openweathermap.org/data/2.5/weather",
                    {
                        params: {
                            q: city,
                            appid:
                                process.env
                                    .OPENWEATHER_API_KEY,
                            units: "metric"
                        }
                    }
                );


            const weatherData = {

                city:
                    response.data.name,

                temperature:
                    response.data.main.temp,

                feels_like:
                    response.data.main.feels_like,

                humidity:
                    response.data.main.humidity,

                condition:
                    response.data.weather[0]
                        .description,

                wind_speed:
                    response.data.wind.speed

            };


            // Save search to MongoDB

            const weather =
                new Weather(
                    weatherData
                );

            await weather.save();


            res.json(
                weatherData
            );


        } catch (error) {

            console.log(
                "Weather error:",
                error.message
            );


            if (
                error.response &&
                error.response.status === 404
            ) {

                return res
                    .status(404)
                    .json({
                        error:
                            "City not found"
                    });

            }


            res
                .status(500)
                .json({
                    error:
                        "Unable to fetch weather data"
                });

        }

    }
);


// =========================
// WEATHER HISTORY
// =========================

app.get(
    "/api/weather-history",
    async (req, res) => {

        try {

            const history =
                await Weather.find()
                    .sort({
                        searchedAt: -1
                    })
                    .limit(20);


            res.json(
                history
            );


        } catch (error) {

            console.log(
                "History error:",
                error.message
            );


            res
                .status(500)
                .json({
                    error:
                        "Unable to fetch weather history"
                });

        }

    }
);


// =========================
// INTELLIGENT WEATHER ADVICE
// =========================

app.get(
    "/api/weather-advice/:city",
    async (req, res) => {

        try {

            const city =
                req.params.city;


            const response =
                await axios.get(
                    "https://api.openweathermap.org/data/2.5/weather",
                    {
                        params: {
                            q: city,
                            appid:
                                process.env
                                    .OPENWEATHER_API_KEY,
                            units: "metric"
                        }
                    }
                );


            const weather =
                response.data;


            const temperature =
                weather.main.temp;

            const feelsLike =
                weather.main.feels_like;

            const humidity =
                weather.main.humidity;

            const windSpeed =
                weather.wind.speed;

            const condition =
                weather.weather[0]
                    .description
                    .toLowerCase();


            const advice = [];


            // Temperature advice

            if (temperature >= 35) {

                advice.push(
                    "Very hot weather. Stay hydrated and avoid prolonged outdoor activity."
                );

            } else if (temperature >= 30) {

                advice.push(
                    "It is hot outside. Drink plenty of water and take breaks in shaded areas."
                );

            } else if (temperature >= 25) {

                advice.push(
                    "The temperature is warm. Light and comfortable clothing is recommended."
                );

            } else if (temperature >= 18) {

                advice.push(
                    "The temperature is comfortable. Normal outdoor activities should be fine."
                );

            } else {

                advice.push(
                    "The weather is relatively cool. Consider wearing an extra layer."
                );

            }


            // Humidity advice

            if (humidity >= 80) {

                advice.push(
                    "Humidity is very high, so you may feel warmer than the actual temperature."
                );

            } else if (humidity >= 60) {

                advice.push(
                    "Humidity is moderately high. Stay hydrated and choose breathable clothing."
                );

            }


            // Feels-like temperature

            if (feelsLike >= 40) {

                advice.push(
                    "The feels-like temperature is extremely high. Avoid strenuous outdoor activity."
                );

            }


            // Rain

            if (
                condition.includes("rain") ||
                condition.includes("drizzle")
            ) {

                advice.push(
                    "Rain is currently present or expected. Carry an umbrella and be careful on wet roads."
                );

            }


            // Thunderstorm

            if (
                condition.includes(
                    "thunderstorm"
                )
            ) {

                advice.push(
                    "Thunderstorms are present. Avoid open areas and seek shelter indoors."
                );

            }


            // Clear sky

            if (
                condition.includes(
                    "clear sky"
                ) ||
                condition === "clear"
            ) {

                advice.push(
                    "The sky is clear. Sunglasses and sun protection may be useful during the day."
                );

            }


            // Clouds

            if (
                condition.includes("cloud")
            ) {

                advice.push(
                    "Cloudy conditions are present. Outdoor activities should generally be comfortable."
                );

            }


            // Wind

            if (windSpeed >= 10) {

                advice.push(
                    "Strong winds are present. Be careful around trees, temporary structures, and open areas."
                );

            } else if (windSpeed >= 5) {

                advice.push(
                    "Moderate winds are present. Outdoor activities are generally fine, but take care with loose objects."
                );

            }


            res.json({

                city:
                    weather.name,

                temperature,

                feels_like:
                    feelsLike,

                humidity,

                condition:
                    weather.weather[0]
                        .description,

                wind_speed:
                    windSpeed,

                advice

            });


        } catch (error) {

            console.log(
                "Weather advice error:",
                error.message
            );


            if (
                error.response &&
                error.response.status === 404
            ) {

                return res
                    .status(404)
                    .json({
                        error:
                            "City not found"
                    });

            }


            res
                .status(500)
                .json({
                    error:
                        "Unable to generate weather advice"
                });

        }

    }
);


// =========================
// 5-DAY FORECAST
// =========================

app.get(
    "/api/forecast/:city",
    async (req, res) => {

        try {

            const city =
                req.params.city;


            const response =
                await axios.get(
                    "https://api.openweathermap.org/data/2.5/forecast",
                    {
                        params: {
                            q: city,
                            appid:
                                process.env
                                    .OPENWEATHER_API_KEY,
                            units: "metric"
                        }
                    }
                );


            const forecast =
                response.data.list.map(
                    item => ({

                        date_time:
                            item.dt_txt,

                        temperature:
                            item.main.temp,

                        feels_like:
                            item.main.feels_like,

                        humidity:
                            item.main.humidity,

                        condition:
                            item.weather[0]
                                .description,

                        wind_speed:
                            item.wind.speed

                    })
                );


            res.json({

                city:
                    response.data.city.name,

                forecast

            });


        } catch (error) {

            console.log(
                "Forecast error:",
                error.message
            );


            if (
                error.response &&
                error.response.status === 404
            ) {

                return res
                    .status(404)
                    .json({
                        error:
                            "City not found"
                    });

            }


            res
                .status(500)
                .json({
                    error:
                        "Unable to fetch forecast"
                });

        }

    }
);


// =========================
// WEATHER ALERTS
// =========================

app.get(
    "/api/weather-alerts/:city",
    async (req, res) => {

        try {

            const city =
                req.params.city;


            const response =
                await axios.get(
                    "https://api.openweathermap.org/data/2.5/weather",
                    {
                        params: {
                            q: city,
                            appid:
                                process.env
                                    .OPENWEATHER_API_KEY,
                            units: "metric"
                        }
                    }
                );


            const weather =
                response.data;


            const temperature =
                weather.main.temp;

            const feelsLike =
                weather.main.feels_like;

            const humidity =
                weather.main.humidity;

            const windSpeed =
                weather.wind.speed;

            const condition =
                weather.weather[0]
                    .description
                    .toLowerCase();


            const alerts = [];


            // Extreme heat

            if (
                temperature >= 40 ||
                feelsLike >= 45
            ) {

                alerts.push({

                    type:
                        "Extreme Heat",

                    severity:
                        "High",

                    message:
                        "Extremely hot conditions detected. Stay indoors when possible, drink plenty of water, and avoid strenuous outdoor activity."

                });

            } else if (
                temperature >= 35 ||
                feelsLike >= 40
            ) {

                alerts.push({

                    type:
                        "Heat Warning",

                    severity:
                        "Moderate",

                    message:
                        "High heat conditions detected. Stay hydrated and limit prolonged exposure to the sun."

                });

            }


            // Thunderstorm

            if (
                condition.includes(
                    "thunderstorm"
                )
            ) {

                alerts.push({

                    type:
                        "Thunderstorm",

                    severity:
                        "High",

                    message:
                        "Thunderstorm conditions detected. Stay indoors and avoid open areas."

                });

            }


            // Rain

            if (
                condition.includes(
                    "heavy rain"
                ) ||
                condition.includes(
                    "very heavy rain"
                )
            ) {

                alerts.push({

                    type:
                        "Heavy Rain",

                    severity:
                        "High",

                    message:
                        "Heavy rainfall is currently reported. Take care while travelling and avoid flooded areas."

                });

            } else if (
                condition.includes("rain") ||
                condition.includes("drizzle")
            ) {

                alerts.push({

                    type:
                        "Rain",

                    severity:
                        "Low",

                    message:
                        "Rain is currently reported. Carry an umbrella and be careful on wet roads."

                });

            }


            // Wind

            if (windSpeed >= 15) {

                alerts.push({

                    type:
                        "Strong Wind",

                    severity:
                        "High",

                    message:
                        "Very strong winds are present. Avoid exposed areas and be careful around trees and temporary structures."

                });

            } else if (
                windSpeed >= 10
            ) {

                alerts.push({

                    type:
                        "Wind Warning",

                    severity:
                        "Moderate",

                    message:
                        "Strong winds are present. Take care around trees, loose objects, and temporary structures."

                });

            }


            // Humidity

            if (
                humidity >= 85
            ) {

                alerts.push({

                    type:
                        "High Humidity",

                    severity:
                        "Moderate",

                    message:
                        "Very high humidity is present. Stay hydrated and use breathable clothing."

                });

            }


            // No alerts

            if (
                alerts.length === 0
            ) {

                alerts.push({

                    type:
                        "No Major Alerts",

                    severity:
                        "Low",

                    message:
                        "No major weather alerts detected for the current conditions."

                });

            }


            res.json({

                city:
                    weather.name,

                temperature,

                feels_like:
                    feelsLike,

                humidity,

                condition:
                    weather.weather[0]
                        .description,

                wind_speed:
                    windSpeed,

                alerts

            });


        } catch (error) {

            console.log(
                "Weather alerts error:",
                error.message
            );


            if (
                error.response &&
                error.response.status === 404
            ) {

                return res
                    .status(404)
                    .json({
                        error:
                            "City not found"
                    });

            }


            res
                .status(500)
                .json({
                    error:
                        "Unable to generate weather alerts"
                });

        }

    }
);


// =========================
// WEATHER SUMMARY
// =========================

app.get(
    "/api/weather-summary/:city",
    async (req, res) => {

        try {

            const city =
                req.params.city;


            const response =
                await axios.get(
                    "https://api.openweathermap.org/data/2.5/weather",
                    {
                        params: {
                            q: city,
                            appid:
                                process.env
                                    .OPENWEATHER_API_KEY,
                            units: "metric"
                        }
                    }
                );


            const weather =
                response.data;


            const temperature =
                weather.main.temp;

            const feelsLike =
                weather.main.feels_like;

            const humidity =
                weather.main.humidity;

            const windSpeed =
                weather.wind.speed;

            const condition =
                weather.weather[0]
                    .description;


            let temperatureDescription;


            if (
                temperature >= 35
            ) {

                temperatureDescription =
                    "very hot";

            } else if (
                temperature >= 30
            ) {

                temperatureDescription =
                    "hot";

            } else if (
                temperature >= 25
            ) {

                temperatureDescription =
                    "warm";

            } else if (
                temperature >= 18
            ) {

                temperatureDescription =
                    "comfortable";

            } else {

                temperatureDescription =
                    "cool";

            }


            let humidityDescription;


            if (
                humidity >= 80
            ) {

                humidityDescription =
                    "very humid";

            } else if (
                humidity >= 60
            ) {

                humidityDescription =
                    "moderately humid";

            } else {

                humidityDescription =
                    "relatively dry";

            }


            let windDescription;


            if (
                windSpeed >= 10
            ) {

                windDescription =
                    "strong winds";

            } else if (
                windSpeed >= 5
            ) {

                windDescription =
                    "moderate winds";

            } else {

                windDescription =
                    "light winds";

            }


            const summary =

                `${weather.name} is currently ${temperatureDescription} with a temperature of ${temperature}°C. ` +

                `The weather condition is ${condition}. ` +

                `The feels-like temperature is ${feelsLike}°C and the humidity is ${humidity}%. ` +

                `There are ${windDescription} at ${windSpeed} m/s. ` +

                `The humidity level is ${humidityDescription}.`;


            res.json({

                city:
                    weather.name,

                temperature,

                feels_like:
                    feelsLike,

                humidity,

                condition,

                wind_speed:
                    windSpeed,

                summary

            });


        } catch (error) {

            console.log(
                "Weather summary error:",
                error.message
            );


            if (
                error.response &&
                error.response.status === 404
            ) {

                return res
                    .status(404)
                    .json({
                        error:
                            "City not found"
                    });

            }


            res
                .status(500)
                .json({
                    error:
                        "Unable to generate weather summary"
                });

        }

    }
);


// =========================
// START SERVER
// =========================

app.listen(
    5000,
    () => {

        console.log(
            "Server running on port 5000"
        );

    }
);