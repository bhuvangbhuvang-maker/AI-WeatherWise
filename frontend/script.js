const API_URL = "http://localhost:5000";


// =========================
// WEATHER ICON
// =========================

function getWeatherIcon(condition) {

    const text =
        condition.toLowerCase();

    if (
        text.includes("thunderstorm")
    )
        return "⛈️";

    if (
        text.includes("rain")
    )
        return "🌧️";

    if (
        text.includes("drizzle")
    )
        return "🌦️";

    if (
        text.includes("snow")
    )
        return "❄️";

    if (
        text.includes("cloud")
    )
        return "☁️";

    if (
        text.includes("clear")
    )
        return "☀️";

    if (
        text.includes("mist") ||
        text.includes("fog")
    )
        return "🌫️";

    return "🌤️";
}


// =========================
// GET WEATHER
// =========================

async function getWeather() {

    const cityInput =
        document.getElementById(
            "cityInput"
        );

    const city =
        cityInput.value.trim();


    const errorMessage =
        document.getElementById(
            "errorMessage"
        );


    const loadingMessage =
        document.getElementById(
            "loadingMessage"
        );


    const weatherSection =
        document.getElementById(
            "weatherSection"
        );


    if (city === "") {

        errorMessage.textContent =
            "Please enter a city name.";

        weatherSection.classList.add(
            "hidden"
        );

        return;

    }


    errorMessage.textContent = "";

    weatherSection.classList.add(
        "hidden"
    );

    loadingMessage.classList.remove(
        "hidden"
    );


    try {

        // CURRENT WEATHER

        const weatherResponse =
            await fetch(
                `${API_URL}/api/weather/${encodeURIComponent(city)}`
            );


        const weatherData =
            await weatherResponse.json();


        if (!weatherResponse.ok) {

            throw new Error(
                weatherData.error ||
                "City not found"
            );

        }


        document.getElementById(
            "cityName"
        ).textContent =

            `${getWeatherIcon(
                weatherData.condition
            )} ${weatherData.city}`;


        document.getElementById(
            "temperature"
        ).textContent =
            weatherData.temperature;


        document.getElementById(
            "feelsLike"
        ).textContent =
            weatherData.feels_like;


        document.getElementById(
            "humidity"
        ).textContent =
            weatherData.humidity;


        document.getElementById(
            "windSpeed"
        ).textContent =
            weatherData.wind_speed;


        document.getElementById(
            "condition"
        ).textContent =
            weatherData.condition;


        // ADVICE

        const adviceResponse =
            await fetch(
                `${API_URL}/api/weather-advice/${encodeURIComponent(city)}`
            );


        const adviceData =
            await adviceResponse.json();


        const adviceList =
            document.getElementById(
                "adviceList"
            );


        adviceList.innerHTML = "";


        if (
            adviceData.advice &&
            adviceData.advice.length > 0
        ) {

            adviceData.advice.forEach(
                advice => {

                    const li =
                        document.createElement(
                            "li"
                        );

                    li.textContent =
                        advice;

                    adviceList.appendChild(
                        li
                    );

                }
            );

        } else {

            adviceList.innerHTML =
                "<li>No advice available.</li>";

        }


        // ALERTS

        const alertsResponse =
            await fetch(
                `${API_URL}/api/weather-alerts/${encodeURIComponent(city)}`
            );


        const alertsData =
            await alertsResponse.json();


        const alertsContainer =
            document.getElementById(
                "alertsContainer"
            );


        alertsContainer.innerHTML = "";


        if (
            alertsData.alerts &&
            alertsData.alerts.length > 0
        ) {

            alertsData.alerts.forEach(
                alert => {

                    const alertDiv =
                        document.createElement(
                            "div"
                        );


                    alertDiv.className =
                        `alert ${alert.severity.toLowerCase()}`;


                    alertDiv.innerHTML = `

                        <strong>
                            ${alert.type} -
                            ${alert.severity}
                        </strong>

                        <p>
                            ${alert.message}
                        </p>

                    `;


                    alertsContainer.appendChild(
                        alertDiv
                    );

                }
            );

        } else {

            alertsContainer.innerHTML =
                "<p>No weather alerts.</p>";

        }


        // SUMMARY

        const summaryResponse =
            await fetch(
                `${API_URL}/api/weather-summary/${encodeURIComponent(city)}`
            );


        const summaryData =
            await summaryResponse.json();


        document.getElementById(
            "summary"
        ).textContent =
            summaryData.summary;


        // FORECAST

        const forecastResponse =
            await fetch(
                `${API_URL}/api/forecast/${encodeURIComponent(city)}`
            );


        const forecastData =
            await forecastResponse.json();


        displayFiveDayForecast(
            forecastData.forecast
        );


        // CHART

        createTemperatureChart(
            forecastData.forecast
        );


        // HISTORY

        await loadHistory();


        weatherSection.classList.remove(
            "hidden"
        );


    } catch (error) {

        console.error(
            "Weather error:",
            error
        );


        errorMessage.textContent =
            error.message ||
            "Unable to fetch weather data.";


        weatherSection.classList.add(
            "hidden"
        );


    } finally {

        loadingMessage.classList.add(
            "hidden"
        );

    }

}


// =========================
// FIVE-DAY FORECAST
// =========================

function displayFiveDayForecast(
    forecast
) {

    const forecastContainer =
        document.getElementById(
            "forecastContainer"
        );


    forecastContainer.innerHTML = "";


    if (
        !forecast ||
        forecast.length === 0
    ) {

        forecastContainer.innerHTML =
            "<p>No forecast data available.</p>";

        return;

    }


    const dailyData = {};


    forecast.forEach(
        item => {

            const date =
                item.date_time.split(
                    " "
                )[0];


            if (!dailyData[date]) {

                dailyData[date] = [];

            }


            dailyData[date].push(
                item
            );

        }
    );


    const days =
        Object.keys(
            dailyData
        ).slice(0, 5);


    days.forEach(
        (date, index) => {

            const dayData =
                dailyData[date];


            const temperatures =
                dayData.map(
                    item =>
                        item.temperature
                );


            const minTemperature =
                Math.min(
                    ...temperatures
                );


            const maxTemperature =
                Math.max(
                    ...temperatures
                );


            // Forecast closest to noon

            const representative =
                dayData.reduce(
                    (
                        previous,
                        current
                    ) => {

                        const previousHour =
                            new Date(
                                previous.date_time
                            ).getHours();


                        const currentHour =
                            new Date(
                                current.date_time
                            ).getHours();


                        return Math.abs(
                            currentHour - 12
                        ) <
                        Math.abs(
                            previousHour - 12
                        )
                            ? current
                            : previous;

                    }
                );


            const dayDate =
                new Date(
                    `${date}T12:00:00`
                );


            let dayName;


            if (index === 0) {

                dayName = "Today";

            } else if (index === 1) {

                dayName = "Tomorrow";

            } else {

                dayName =
                    dayDate.toLocaleDateString(
                        "en-IN",
                        {
                            weekday:
                                "short"
                        }
                    );

            }


            const formattedDate =
                dayDate.toLocaleDateString(
                    "en-IN",
                    {
                        day:
                            "2-digit",

                        month:
                            "short"
                    }
                );


            const icon =
                getWeatherIcon(
                    representative.condition
                );


            const forecastCard =
                document.createElement(
                    "div"
                );


            forecastCard.className =
                "forecast-card";


            forecastCard.innerHTML = `

                <h3>
                    ${dayName}
                </h3>

                <p>
                    ${formattedDate}
                </p>

                <div style="
                    font-size:45px;
                    margin:10px 0;
                ">
                    ${icon}
                </div>

                <p>
                    ${representative.condition}
                </p>

                <div class="forecast-temp">
                    ${Math.round(
                        maxTemperature
                    )}°C
                </div>

                <p>
                    Low:
                    ${Math.round(
                        minTemperature
                    )}°C
                </p>

                <p>
                    💧
                    ${representative.humidity}%
                </p>

                <p>
                    💨
                    ${representative.wind_speed}
                    m/s
                </p>

            `;


            forecastContainer.appendChild(
                forecastCard
            );

        }
    );

}


// =========================
// TEMPERATURE CHART
// =========================

function createTemperatureChart(
    forecast
) {

    const canvas =
        document.getElementById(
            "temperatureChart"
        );


    if (
        !canvas ||
        !forecast ||
        forecast.length === 0
    ) {

        return;

    }


    const labels = [];

    const temperatures = [];


    forecast.forEach(
        item => {

            const date =
                new Date(
                    item.date_time
                );


            const label =

                date.toLocaleDateString(
                    "en-IN",
                    {
                        day:
                            "2-digit",

                        month:
                            "short"
                    }
                )

                +

                " "

                +

                date.toLocaleTimeString(
                    "en-IN",
                    {
                        hour:
                            "2-digit"
                    }
                );


            labels.push(
                label
            );


            temperatures.push(
                item.temperature
            );

        }
    );


    if (
        window.temperatureChartInstance
    ) {

        window.temperatureChartInstance.destroy();

    }


    window.temperatureChartInstance =
        new Chart(
            canvas,
            {

                type: "line",


                data: {

                    labels: labels,


                    datasets: [

                        {

                            label:
                                "Temperature (°C)",

                            data:
                                temperatures,

                            tension:
                                0.3,

                            fill:
                                false

                        }

                    ]

                },


                options: {

                    responsive:
                        true,


                    plugins: {

                        legend: {

                            display:
                                true

                        }

                    },


                    scales: {

                        y: {

                            title: {

                                display:
                                    true,

                                text:
                                    "Temperature (°C)"

                            }

                        },


                        x: {

                            title: {

                                display:
                                    true,

                                text:
                                    "Date & Time"

                            }

                        }

                    }

                }

            }
        );

}


// =========================
// SEARCH HISTORY
// =========================

async function loadHistory() {

    try {

        const response =
            await fetch(
                `${API_URL}/api/weather-history`
            );


        const history =
            await response.json();


        const historyContainer =
            document.getElementById(
                "historyContainer"
            );


        historyContainer.innerHTML =
            "";


        if (
            !Array.isArray(history) ||
            history.length === 0
        ) {

            historyContainer.innerHTML =
                "<p>No search history available.</p>";

            return;

        }


        history.forEach(
            item => {

                const historyItem =
                    document.createElement(
                        "div"
                    );


                historyItem.className =
                    "history-item";


                const date =
                    new Date(
                        item.searchedAt
                    );


                const icon =
                    getWeatherIcon(
                        item.condition || ""
                    );


                historyItem.innerHTML = `

                    <strong>
                        ${icon}
                        ${item.city}
                    </strong>

                    <br>

                    🌡️
                    ${item.temperature}°C

                    &nbsp; | &nbsp;

                    💧
                    ${item.humidity}%

                    &nbsp; | &nbsp;

                    💨
                    ${item.wind_speed}
                    m/s

                    <br>

                    <small>
                        ${date.toLocaleString(
                            "en-IN"
                        )}
                    </small>

                `;


                historyContainer.appendChild(
                    historyItem
                );

            }
        );


    } catch (error) {

        console.error(
            "History error:",
            error
        );

    }

}


// =========================
// ENTER KEY SEARCH
// =========================

document
    .getElementById(
        "cityInput"
    )
    .addEventListener(
        "keypress",
        function(event) {

            if (
                event.key === "Enter"
            ) {

                getWeather();

            }

        }
    );