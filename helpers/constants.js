export const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN;

export const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

const CITY = process.env.CITY;
export const API_URL = `https://api.openweathermap.org/data/2.5/forecast?q=${CITY}&units=metric&appid=${WEATHER_API_KEY}`;

export const MONO_API_URL = `https://api.monobank.ua/bank/currency`;
