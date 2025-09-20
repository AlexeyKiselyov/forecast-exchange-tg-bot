import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';

import { TG_BOT_TOKEN } from './helpers/constants.js';
import { getForecast } from './helpers/getForecast.js';
import { getRate, compareRates } from './helpers/getRate.js';
import {
  optionsStart,
  optionsWeatherMenu,
  optionsRateMenu,
  inlineOptionsStart,
  inlineOptionsWeatherMenu,
  inlineOptionsRateMenu,
  inlineCompareOptions,
  inlineOptionsCityMenu,
} from './helpers/buttonsOptions.js';
import {
  createLoadingMessage,
  createHeader,
  EMOJI,
} from './helpers/messageFormatter.js';

const bot = new TelegramBot(TG_BOT_TOKEN, { polling: true });

// Keep loading state per chat
const loadingStates = new Map();

// Keep selected cities per user
const userCities = new Map();

// Track city input waiting state
const waitingForCityInput = new Map();

// Get user's current city
const getUserCity = userId => {
  return userCities.get(userId) || process.env.CITY || 'Kyiv';
};

// Set user's current city
const setUserCity = (userId, city) => {
  userCities.set(userId, city);
};

bot.setMyCommands([
  { command: '/start', description: 'Розпочати роботу з ботом 🚀' },
  { command: '/help', description: 'Допомога та інструкції 📋' },
  { command: '/weather', description: 'Швидкий прогноз погоди ⚡' },
  { command: '/rates', description: 'Швидкі курси валют ⚡' },
]);

// Send a temporary loading message
async function sendLoadingMessage(chatId, type) {
  const loadingMsg = await bot.sendMessage(chatId, createLoadingMessage(type));
  loadingStates.set(chatId, loadingMsg.message_id);
  return loadingMsg.message_id;
}

// Update a message in place; fallback to send new on failure
async function updateMessage(chatId, messageId, text, options) {
  try {
    await bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      ...options,
    });
    loadingStates.delete(chatId);
  } catch (error) {
    const desc = error?.response?.body?.description || error?.message || '';
    // Игнорируем безвредную ошибку Telegram "message is not modified"
    if (typeof desc === 'string' && desc.includes('message is not modified')) {
      loadingStates.delete(chatId);
      return;
    }
    // Если не удалось отредактировать по другой причине — отправляем новое сообщение
    await bot.sendMessage(chatId, text, { parse_mode: 'Markdown', ...options });
    loadingStates.delete(chatId);
  }
}

// Text messages handler
bot.on('message', async msg => {
  const text = msg.text;
  const chatId = msg.chat.id;
  const clientName = msg.from.first_name;
  const userId = msg.from.id;
  const currentTime = new Date().toLocaleTimeString('uk-UA');

  // If user is expected to input city name
  if (waitingForCityInput.get(userId)) {
    waitingForCityInput.delete(userId);

    // Validate the city name by trying an API call
    try {
      const messageId = await sendLoadingMessage(chatId, 'weather');
      const forecast = await getForecast('weather_quick', text);

      // On success — store the city for the user
      setUserCity(userId, text);

      await updateMessage(
        chatId,
        messageId,
        forecast,
        inlineOptionsWeatherMenu
      );

      // Send confirmation
      setTimeout(async () => {
        await bot.sendMessage(
          chatId,
          `${EMOJI.ui.success} Місто **${text}** збережено як ваше за замовчуванням!`,
          {
            parse_mode: 'Markdown',
          }
        );
      }, 1000);

      return;
    } catch (error) {
      const errorMessage = `${EMOJI.ui.warning} **Помилка**\n\nНе вдалося знайти місто "${text}". Спробуйте ввести правильну назву міста українською або англійською мовою.`;
      await bot.sendMessage(chatId, errorMessage, {
        parse_mode: 'Markdown',
        ...inlineOptionsCityMenu,
      });
      return;
    }
  }

  try {
    if (text === '/start') {
      const welcomeMessage = `
${createHeader('ЛАСКАВО ПРОСИМО', '🎉')}

Привіт, **${clientName}**! 👋

Я ваш персональний помічник для:

${EMOJI.weather.temp} **Прогнозу погоди** 
${EMOJI.currency.exchange} **Курсів валют**

${EMOJI.ui.info} Оберіть потрібну опцію нижче:
`;
      return await bot.sendMessage(chatId, welcomeMessage, {
        parse_mode: 'Markdown',
        ...inlineOptionsStart,
      });
    }

    if (text === '/help') {
      const helpMessage = `
${createHeader('ДОПОМОГА', '📋')}

**Доступні команди:**
/start - Головне меню
/help - Ця довідка  
/weather - Швидкий прогноз
/rates - Швидкі курси

**Функції бота:**
${EMOJI.weather.temp} Прогноз погоди на 24 години
${EMOJI.weather.windy} Детальна інформація про вітер
${EMOJI.currency.dollar} Курси USD та EUR
${EMOJI.currency.exchange} Порівняння валют

${EMOJI.ui.info} Виберіть опцію в меню або використовуйте команди!
`;
      return await bot.sendMessage(chatId, helpMessage, {
        parse_mode: 'Markdown',
        ...inlineOptionsStart,
      });
    }

    if (text === '/weather') {
      const messageId = await sendLoadingMessage(chatId, 'weather');
      const userCity = getUserCity(msg.from.id);
      const forecast = await getForecast('weather_quick', userCity);
      await updateMessage(
        chatId,
        messageId,
        forecast,
        inlineOptionsWeatherMenu
      );
      return;
    }

    if (text === '/rates') {
      const messageId = await sendLoadingMessage(chatId, 'currency');
      const rates = await compareRates();
      await updateMessage(chatId, messageId, rates, inlineOptionsRateMenu);
      return;
    }

    // Support old text commands for backward compatibility
    if (text === '/Погода 🌡️') {
      const weatherMessage = `${createHeader(
        'МЕНЮ ПОГОДИ',
        EMOJI.weather.temp
      )}\n\nОберіть тип прогнозу:`;
      return await bot.sendMessage(chatId, weatherMessage, {
        parse_mode: 'Markdown',
        ...inlineOptionsWeatherMenu,
      });
    }

    if (text === '/Курс валют 💹') {
      const currencyMessage = `${createHeader(
        'МЕНЮ ВАЛЮТ',
        EMOJI.currency.exchange
      )}\n\nОберіть валюту або дію:`;
      return await bot.sendMessage(chatId, currencyMessage, {
        parse_mode: 'Markdown',
        ...inlineOptionsRateMenu,
      });
    }

    // More legacy text commands
    if (['Кожні 3 години 🕒', 'Кожні 6 годин 🕕', 'Вітер 💨'].includes(text)) {
      const messageId = await sendLoadingMessage(chatId, 'weather');
      const userCity = getUserCity(msg.from.id);
      const forecast = await getForecast(text, userCity);
      await updateMessage(
        chatId,
        messageId,
        forecast,
        inlineOptionsWeatherMenu
      );
      return;
    }

    if (['USD', 'EUR'].includes(text)) {
      const messageId = await sendLoadingMessage(chatId, 'currency');
      const rate = await getRate(text);
      await updateMessage(chatId, messageId, rate, inlineOptionsRateMenu);
      return;
    }

    if (text === 'Попереднє меню ⬅️') {
      const mainMessage = `${createHeader(
        'ГОЛОВНЕ МЕНЮ',
        EMOJI.ui.home
      )}\n\n**${clientName}**, оберіть потрібну опцію:`;
      return await bot.sendMessage(chatId, mainMessage, {
        parse_mode: 'Markdown',
        ...inlineOptionsStart,
      });
    }
  } catch (error) {
    console.log(`Error: ${error.message}`);
    const errorMessage = `${EMOJI.ui.warning} **Виникла помилка**\n\nСпробуйте пізніше або зверніться до адміністратора.\n\n_Час: ${currentTime}_`;
    return bot.sendMessage(chatId, errorMessage, {
      parse_mode: 'Markdown',
      ...inlineOptionsStart,
    });
  }

  // Unknown command fallback
  const unknownMessage = `${EMOJI.ui.info} Я не розумію цю команду, **${clientName}**.\n\nВикористовуйте меню нижче або команди /help`;
  return bot.sendMessage(chatId, unknownMessage, {
    parse_mode: 'Markdown',
    ...inlineOptionsStart,
  });
});

// Inline buttons handler
bot.on('callback_query', async callbackQuery => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const data = callbackQuery.data;
  const clientName = callbackQuery.from.first_name;

  // Show loading indicator on callback
  await bot.answerCallbackQuery(callbackQuery.id, {
    text: '⏳ Обробляю...',
    show_alert: false,
  });

  try {
    switch (data) {
      case 'main_menu':
        const mainMessage = `${createHeader(
          'ГОЛОВНЕ МЕНЮ',
          EMOJI.ui.home
        )}\n\n**${clientName}**, оберіть потрібну опцію:`;
        await bot.editMessageText(mainMessage, {
          chat_id: chatId,
          message_id: msg.message_id,
          parse_mode: 'Markdown',
          ...inlineOptionsStart,
        });
        break;

      case 'weather_menu':
        const weatherMessage = `${createHeader(
          'МЕНЮ ПОГОДИ',
          EMOJI.weather.temp
        )}\n\nОберіть тип прогнозу:`;
        await bot.editMessageText(weatherMessage, {
          chat_id: chatId,
          message_id: msg.message_id,
          parse_mode: 'Markdown',
          ...inlineOptionsWeatherMenu,
        });
        break;

      case 'currency_menu':
        const currencyMessage = `${createHeader(
          'МЕНЮ ВАЛЮТ',
          EMOJI.currency.exchange
        )}\n\nОберіть валюту або дію:`;
        await bot.editMessageText(currencyMessage, {
          chat_id: chatId,
          message_id: msg.message_id,
          parse_mode: 'Markdown',
          ...inlineOptionsRateMenu,
        });
        break;

      case 'weather_3h':
      case 'weather_6h':
      case 'weather_wind':
      case 'weather_quick':
        await bot.editMessageText(createLoadingMessage('weather'), {
          chat_id: chatId,
          message_id: msg.message_id,
          parse_mode: 'Markdown',
        });
        const userCity = getUserCity(callbackQuery.from.id);
        const forecast = await getForecast(data, userCity);
        await bot.editMessageText(forecast, {
          chat_id: chatId,
          message_id: msg.message_id,
          parse_mode: 'Markdown',
          ...inlineOptionsWeatherMenu,
        });
        break;

      case 'weather_refresh':
        await bot.editMessageText(createLoadingMessage('weather'), {
          chat_id: chatId,
          message_id: msg.message_id,
          parse_mode: 'Markdown',
        });
        const userCityRefresh = getUserCity(callbackQuery.from.id);
        const refreshedForecast = await getForecast(
          'weather_quick',
          userCityRefresh
        );
        await bot.editMessageText(refreshedForecast, {
          chat_id: chatId,
          message_id: msg.message_id,
          parse_mode: 'Markdown',
          ...inlineOptionsWeatherMenu,
        });
        break;

      case 'select_city':
        const currentCity = getUserCity(callbackQuery.from.id);
        const cityMessage = `${createHeader('ВИБІР МІСТА', '🏙️')}\n\n${
          EMOJI.ui.location
        } **Поточне місто:** ${currentCity}\n\nОберіть місто для прогнозу погоди:`;
        await bot.editMessageText(cityMessage, {
          chat_id: chatId,
          message_id: msg.message_id,
          parse_mode: 'Markdown',
          ...inlineOptionsCityMenu,
        });
        break;

      // City selection handlers
      case 'city_Kyiv':
      case 'city_Kharkiv':
      case 'city_Odesa':
      case 'city_Dnipro':
      case 'city_Lviv':
      case 'city_Zaporizhzhia':
      case 'city_Kryvyi Rih':
      case 'city_Mykolaiv':
      case 'city_Mariupol':
        const selectedCity = data.split('_')[1].replace('Rih', 'Rih'); // Kryvyi Rih
        setUserCity(callbackQuery.from.id, selectedCity);

        await bot.editMessageText(createLoadingMessage('weather'), {
          chat_id: chatId,
          message_id: msg.message_id,
          parse_mode: 'Markdown',
        });

        const cityForecast = await getForecast('weather_quick', selectedCity);
        await bot.editMessageText(cityForecast, {
          chat_id: chatId,
          message_id: msg.message_id,
          parse_mode: 'Markdown',
          ...inlineOptionsWeatherMenu,
        });

        // Send confirmation after 1 second
        setTimeout(async () => {
          await bot.sendMessage(
            chatId,
            `${EMOJI.ui.success} Місто **${selectedCity}** обрано як за замовчуванням!`,
            {
              parse_mode: 'Markdown',
            }
          );
        }, 1000);
        break;

      case 'custom_city':
        waitingForCityInput.set(callbackQuery.from.id, true);
        const customCityMessage = `${EMOJI.ui.info} **Введіть назву міста**\n\nНапишіть назву міста українською або англійською мовою.\n\n_Приклад: Київ, Kyiv, Харків, Kharkiv_`;
        await bot.editMessageText(customCityMessage, {
          chat_id: chatId,
          message_id: msg.message_id,
          parse_mode: 'Markdown',
          ...inlineOptionsCityMenu,
        });
        break;

      case 'rate_USD':
      case 'rate_EUR':
        await bot.editMessageText(createLoadingMessage('currency'), {
          chat_id: chatId,
          message_id: msg.message_id,
          parse_mode: 'Markdown',
        });
        const currency = data.split('_')[1];
        const rate = await getRate(currency);
        await bot.editMessageText(rate, {
          chat_id: chatId,
          message_id: msg.message_id,
          parse_mode: 'Markdown',
          ...inlineOptionsRateMenu,
        });
        break;

      case 'rate_compare':
        await bot.editMessageText(createLoadingMessage('currency'), {
          chat_id: chatId,
          message_id: msg.message_id,
          parse_mode: 'Markdown',
        });
        const comparison = await compareRates();
        await bot.editMessageText(comparison, {
          chat_id: chatId,
          message_id: msg.message_id,
          parse_mode: 'Markdown',
          ...inlineCompareOptions,
        });
        break;

      case 'rate_refresh':
        await bot.editMessageText(createLoadingMessage('currency'), {
          chat_id: chatId,
          message_id: msg.message_id,
          parse_mode: 'Markdown',
        });
        const refreshedRates = await compareRates();
        await bot.editMessageText(refreshedRates, {
          chat_id: chatId,
          message_id: msg.message_id,
          parse_mode: 'Markdown',
          ...inlineOptionsRateMenu,
        });
        break;

      case 'rate_quick':
        await bot.editMessageText(createLoadingMessage('currency'), {
          chat_id: chatId,
          message_id: msg.message_id,
          parse_mode: 'Markdown',
        });
        const quickRates = await compareRates();
        await bot.editMessageText(quickRates, {
          chat_id: chatId,
          message_id: msg.message_id,
          parse_mode: 'Markdown',
          ...inlineOptionsRateMenu,
        });
        break;

      case 'compare_usd_eur':
        await bot.editMessageText(createLoadingMessage('currency'), {
          chat_id: chatId,
          message_id: msg.message_id,
          parse_mode: 'Markdown',
        });
        const usdEurComparison = await compareRates();
        await bot.editMessageText(usdEurComparison, {
          chat_id: chatId,
          message_id: msg.message_id,
          parse_mode: 'Markdown',
          ...inlineCompareOptions,
        });
        break;

      case 'about':
        const aboutMessage = `
${createHeader('ПРО БОТА', 'ℹ️')}

**Функції:**
${EMOJI.weather.temp} Прогноз погоди від OpenWeatherMap
${EMOJI.currency.exchange} Курси валют від MonoBank
${EMOJI.ui.clock} Актуальні дані в реальному часі
${EMOJI.weather.windy} Детальна інформація про вітер

**Версія:** 2.0
**Розробник:** Oleksii Kysel'ov
**Дата:** ${new Date().toLocaleDateString('uk-UA')}

${EMOJI.ui.info} Дані оновлюються автоматично
`;
        await bot.editMessageText(aboutMessage, {
          chat_id: chatId,
          message_id: msg.message_id,
          parse_mode: 'Markdown',
          ...inlineOptionsStart,
        });
        break;

      default:
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: '❌ Невідома команда',
          show_alert: true,
        });
    }
  } catch (error) {
    const desc = error?.response?.body?.description || error?.message || '';
    console.log(`Callback error: ${desc}`);
    // Harmless: trying to edit with the same content/markup – ignore silently
    if (typeof desc === 'string' && desc.includes('message is not modified')) {
      return;
    }
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '❌ Виникла помилка',
      show_alert: true,
    });
  }
});
