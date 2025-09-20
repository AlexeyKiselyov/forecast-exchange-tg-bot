import axios from 'axios';

import { WEATHER_API_KEY } from './constants.js';
import {
  formatWeatherForecast,
  createErrorMessage,
} from './messageFormatter.js';

// Build API URL with a dynamic city
const createWeatherURL = city => {
  return `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
    city
  )}&units=metric&appid=${WEATHER_API_KEY}`;
};

export const getForecast = async (query, city = process.env.CITY || 'Kyiv') => {
  try {
    const weatherURL = createWeatherURL(city);
    const forecast = await axios(weatherURL);

    // Get the city name from API response
    const cityName = forecast.data.city.name;

    // Filter data depending on the requested mode
    let filteredForecast;
    if (query === 'Кожні 3 години 🕒' || query === 'weather_3h') {
      filteredForecast = forecast.data.list.slice(0, 8); // 8 records = 24h
    } else if (query === 'Кожні 6 годин 🕕' || query === 'weather_6h') {
      filteredForecast = forecast.data.list
        .filter((_, ind) => ind % 2 === 0)
        .slice(0, 8); // take every second item
    } else if (query === 'Вітер 💨' || query === 'weather_wind') {
      filteredForecast = forecast.data.list.slice(0, 8);
    } else if (query === 'weather_quick') {
      // Quick forecast — only the nearest 3 entries
      filteredForecast = forecast.data.list.slice(0, 3);
    } else {
      filteredForecast = forecast.data.list.slice(0, 8);
    }

    // Format message using the formatter
    const formattedMessage = formatWeatherForecast(
      cityName,
      filteredForecast,
      query
    );

    return formattedMessage;
  } catch (error) {
    console.log(error.message);
    return createErrorMessage(error.message, 'weather');
  }
};
