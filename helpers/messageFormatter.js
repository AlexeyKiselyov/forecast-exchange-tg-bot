export const EMOJI = {
  weather: {
    sunny: '☀️',
    cloudy: '☁️',
    rainy: '🌧️',
    snowy: '❄️',
    windy: '💨',
    temp: '🌡️',
    humidity: '💧',
    pressure: '📊',
  },
  currency: {
    dollar: '💵',
    euro: '💶',
    exchange: '💱',
    up: '📈',
    down: '📉',
    equal: '➡️',
  },
  ui: {
    clock: '🕐',
    calendar: '📅',
    location: '📍',
    warning: '⚠️',
    info: 'ℹ️',
    success: '✅',
    loading: '⏳',
    back: '⬅️',
    home: '🏠',
  },
};

// Creates a nice header (visual centering)
export const createHeader = (title, emoji = '', decorative = true) => {
  // Build header text with emojis on both sides (if provided)
  const headerText = emoji ? `${emoji} ${title} ${emoji}` : title;

  // Target "line width" in characters for visual centering.
  const ENV_TARGET = Number(process.env.HEADER_TARGET_WIDTH);
  const TARGET_WIDTH = Math.max(
    24,
    Math.min(40, Number.isFinite(ENV_TARGET) ? ENV_TARGET : 32)
  );

  // Count by code points (works better with emojis than .length)
  const codePointLength = Array.from(headerText).length;

  // Use Braille blank U+2800 — doesn't collapse in Telegram
  const PAD = '⠀';

  const totalPad = Math.max(0, TARGET_WIDTH - codePointLength);

  // Slight right bias: emojis are visually wider than 1 character
  const emojiMatches = headerText.match(
    /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu
  );
  const emojiCount = emojiMatches ? emojiMatches.length : 0;
  // Conservative bias: apply 1 "space" only if emojis exist on both sides
  const hasBothSidesEmoji = emojiCount >= 2;
  const bias = hasBothSidesEmoji ? 1 : 0;

  let leftPad = Math.ceil(totalPad / 2) + bias;
  if (leftPad > totalPad) leftPad = totalPad; // guard for small totalPad
  const rightPad = totalPad - leftPad;

  const left = PAD.repeat(leftPad);
  const right = PAD.repeat(rightPad);

  // Return bold header with symmetric "spaces" for centered look
  const lineTop = `${left}**${headerText}**${right}`;

  if (!decorative) return lineTop;

  // Decorative underline below the header
  const DECOR = (process.env.HEADER_DECOR_CHAR || '─').slice(0, 1); // line character
  // Full width underline is controlled by env vars
  const DECOR_FULL = ['1', 'true', 'yes'].includes(
    String(process.env.HEADER_DECOR_FULL || '').toLowerCase()
  );
  const ENV_DECOR_WIDTH = Number(process.env.HEADER_DECOR_WIDTH);
  // If full-width mode is enabled and no width is provided — use a larger default
  const defaultFullWidth = 64;
  const rawDecorWidth = Number.isFinite(ENV_DECOR_WIDTH)
    ? ENV_DECOR_WIDTH
    : DECOR_FULL
    ? defaultFullWidth
    : TARGET_WIDTH;
  const DECOR_WIDTH = Math.max(24, Math.min(160, rawDecorWidth));

  let lineBottom;
  if (DECOR_FULL) {
    // Full width: solid line without side padding, length DECOR_WIDTH
    const fullUnderline = DECOR.repeat(DECOR_WIDTH);
    lineBottom = fullUnderline;
  } else {
    // Default: underline within the header "block"
    const underline = DECOR.repeat(codePointLength);
    lineBottom = `${left}${underline}${right}`;
  }

  return `${lineTop}\n${lineBottom}`;
};

// Creates a simple info card
export const createCard = (title, content, emoji = '') => {
  return `${emoji} **${title}**\n${content}\n`;
};

// Formats UNIX timestamp to DD.MM HH:mm
export const formatTime = timestamp => {
  const date = new Date(timestamp * 1000);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${day}.${month} ${hours}:${minutes}`;
};

// Formats currency rate message
export const formatCurrencyRate = (
  currency,
  rateBuy,
  rateSell,
  date,
  trend = null
) => {
  const currencyEmoji =
    currency === 'USD' ? EMOJI.currency.dollar : EMOJI.currency.euro;
  const trendEmoji =
    trend === 'up'
      ? EMOJI.currency.up
      : trend === 'down'
      ? EMOJI.currency.down
      : EMOJI.currency.equal;

  return `${createHeader(`${currency}/UAH`, currencyEmoji)}

${EMOJI.ui.calendar} *Дата:* ${date}
${trendEmoji} *Тенденція:* ${
    trend === 'up' ? 'Зростання' : trend === 'down' ? 'Падіння' : 'Стабільно'
  }

${EMOJI.currency.exchange} *Курси обміну:*
▫️ Покупка: *${rateBuy} ₴*
▫️ Продаж: *${rateSell} ₴*

${EMOJI.ui.info} _Дані з MonoBank API_`;
};

// Formats weather forecast message
export const formatWeatherForecast = (cityName, forecasts, queryType) => {
  const weatherEmoji = getWeatherEmoji(forecasts[0]?.weather?.[0]?.main);

  let header = '';
  switch (queryType) {
    case 'Кожні 3 години 🕒':
      header = createHeader(`Погода кожні 3 години`, EMOJI.weather.temp);
      break;
    case 'Кожні 6 годин 🕕':
      header = createHeader(`Погода кожні 6 годин`, EMOJI.weather.temp);
      break;
    case 'Вітер 💨':
      header = createHeader(`Інформація про вітер`, EMOJI.weather.windy);
      break;
    default:
      header = createHeader(`Прогноз погоди`, weatherEmoji);
  }

  const location = `${EMOJI.ui.location} **Місто:** ${cityName}\n`;

  const forecastItems = forecasts
    .map(item => {
      const {
        dt,
        main: { temp },
        weather: [{ main, description }],
        wind: { speed, deg, gust },
      } = item;
      const time = formatTime(dt);
      const weatherIcon = getWeatherEmoji(main);

      if (queryType === 'Вітер 💨') {
        return `${EMOJI.ui.clock} **${time}**
${EMOJI.weather.windy} Швидкість: **${speed} м/с**
🧭 Напрямок: **${deg}°**
💥 Порив: **${gust || 'н/д'} м/с**
`;
      } else {
        return `${EMOJI.ui.clock} **${time}**
${weatherIcon} **${temp}°C** - ${translateWeather(description)}
${EMOJI.weather.windy} Вітер: **${speed} м/с**
`;
      }
    })
    .join('───────────────────\n');

  return `${header}\n${location}\n${forecastItems}\n${EMOJI.ui.info} _Дані з OpenWeatherMap_`;
};

// Returns an emoji by weather type
const getWeatherEmoji = weatherType => {
  const weatherMap = {
    Clear: EMOJI.weather.sunny,
    Clouds: EMOJI.weather.cloudy,
    Rain: EMOJI.weather.rainy,
    Snow: EMOJI.weather.snowy,
    Thunderstorm: '⛈️',
    Drizzle: '🌦️',
    Mist: '🌫️',
    Fog: '🌫️',
  };
  return weatherMap[weatherType] || EMOJI.weather.cloudy;
};

// Translates weather description (EN -> UK)
const translateWeather = description => {
  const translations = {
    'clear sky': 'ясне небо',
    'few clouds': 'мало хмар',
    'scattered clouds': 'розсіяні хмари',
    'broken clouds': 'хмарно',
    'shower rain': 'дощ з грозою',
    rain: 'дощ',
    thunderstorm: 'гроза',
    snow: 'сніг',
    mist: 'туман',
    'overcast clouds': 'суцільна хмарність',
  };
  return translations[description?.toLowerCase()] || description;
};

// Creates a loading message by type
export const createLoadingMessage = type => {
  const messages = {
    weather: `${EMOJI.ui.loading} Завантажую прогноз погоди...`,
    currency: `${EMOJI.ui.loading} Отримую курси валют...`,
    default: `${EMOJI.ui.loading} Обробляю запит...`,
  };
  return messages[type] || messages.default;
};

// Creates an error message
export const createErrorMessage = (error, type) => {
  return `${EMOJI.ui.warning} **Помилка**

Не вдалося отримати ${type === 'weather' ? 'прогноз погоды' : 'курси валют'}.

${EMOJI.ui.info} Спробуйте пізніше або зверніться до адміністратора.

_Деталі: ${error}_`;
};
