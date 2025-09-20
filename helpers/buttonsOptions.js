// Inline keyboards for a modern UI
export const inlineOptionsStart = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [
        { text: '🌡️ Погода', callback_data: 'weather_menu' },
        { text: '💹 Курс валют', callback_data: 'currency_menu' },
      ],
      [{ text: 'ℹ️ Про бота', callback_data: 'about' }],
    ],
  }),
};

export const inlineOptionsWeatherMenu = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [
        { text: '🕒 Кожні 3 години', callback_data: 'weather_3h' },
        { text: '🕕 Кожні 6 годин', callback_data: 'weather_6h' },
      ],
      [{ text: '💨 Інформація про вітер', callback_data: 'weather_wind' }],
      [{ text: '🏙️ Обрати місто', callback_data: 'select_city' }],
      [
        { text: '🔄 Оновити', callback_data: 'weather_refresh' },
        { text: '⬅️ Назад', callback_data: 'main_menu' },
      ],
    ],
  }),
};

// City selection menu
export const inlineOptionsCityMenu = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [
        { text: '🏛️ Київ', callback_data: 'city_Kyiv' },
        { text: '🏭 Харків', callback_data: 'city_Kharkiv' },
        { text: '🏖️ Одеса', callback_data: 'city_Odesa' },
      ],
      [
        { text: '🏭 Дніпро', callback_data: 'city_Dnipro' },
        { text: '🌆 Львів', callback_data: 'city_Lviv' },
        { text: '🏘️ Запоріжжя', callback_data: 'city_Zaporizhzhia' },
      ],
      [
        { text: '🏭 Кривий Ріг', callback_data: 'city_Kryvyi Rih' },
        { text: '🏛️ Миколаїв', callback_data: 'city_Mykolaiv' },
        { text: '🌳 Маріуполь', callback_data: 'city_Mariupol' },
      ],
      [{ text: '✏️ Інше місто', callback_data: 'custom_city' }],
      [
        { text: '⬅️ До погоди', callback_data: 'weather_menu' },
        { text: '🏠 Головна', callback_data: 'main_menu' },
      ],
    ],
  }),
};

export const inlineOptionsRateMenu = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [
        { text: '💵 USD/UAH', callback_data: 'rate_USD' },
        { text: '💶 EUR/UAH', callback_data: 'rate_EUR' },
      ],
      [{ text: '📊 Порівняти валюти', callback_data: 'rate_compare' }],
      [
        { text: '🔄 Оновити курси', callback_data: 'rate_refresh' },
        { text: '⬅️ Назад', callback_data: 'main_menu' },
      ],
    ],
  }),
};

// Extra inline buttons for quick actions
export const inlineQuickActions = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [
        { text: '⚡ Швидкий прогноз', callback_data: 'weather_quick' },
        { text: '⚡ Швидкий курс', callback_data: 'rate_quick' },
      ],
    ],
  }),
};

// Buttons for currency comparison
export const inlineCompareOptions = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [{ text: '📈 USD vs EUR', callback_data: 'compare_usd_eur' }],
      [
        { text: '⬅️ До валют', callback_data: 'currency_menu' },
        { text: '🏠 Головна', callback_data: 'main_menu' },
      ],
    ],
  }),
};

// Legacy reply keyboards for backward compatibility
export const optionsStart = {
  reply_markup: JSON.stringify({
    keyboard: [[{ text: '/Погода 🌡️' }], [{ text: '/Курс валют 💹' }]],
    resize_keyboard: true,
  }),
};

export const optionsWeatherMenu = {
  reply_markup: JSON.stringify({
    keyboard: [
      [{ text: 'Кожні 3 години 🕒' }, { text: 'Кожні 6 годин 🕕' }],
      [{ text: 'Вітер 💨' }],
      [{ text: 'Попереднє меню ⬅️' }],
    ],
    resize_keyboard: true,
  }),
};

export const optionsRateMenu = {
  reply_markup: JSON.stringify({
    keyboard: [
      [{ text: 'USD' }, { text: 'EUR' }],
      [{ text: 'Попереднє меню ⬅️' }],
    ],
    resize_keyboard: true,
  }),
};
