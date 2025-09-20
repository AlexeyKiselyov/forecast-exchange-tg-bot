import axios from 'axios';
import NodeCache from 'node-cache';

import { MONO_API_URL } from './constants.js';
import {
  formatCurrencyRate,
  createErrorMessage,
  formatTime,
  createHeader,
} from './messageFormatter.js';

const myCache = new NodeCache();

export const getRate = async currency => {
  const uahCode = 980;
  const currencyCode = currency === 'USD' ? 840 : 978;

  try {
    const rateData = await axios(MONO_API_URL);

    const { date, rateBuy, rateSell } = rateData.data.find(
      item =>
        item.currencyCodeA === currencyCode && item.currencyCodeB === uahCode
    );

    const formattedDate = formatTime(date);

    // Determine trend (can be extended later)
    const trend = 'equal'; // static for now; compare with previous values if needed

    // Format message using the formatter
    const formattedMessage = formatCurrencyRate(
      currency,
      rateBuy,
      rateSell,
      formattedDate,
      trend
    );

    const successCache = myCache.set(currency, formattedMessage);

    if (!successCache) {
      console.log('Failed to save rate data in cache!');
    }

    return formattedMessage;
  } catch (error) {
    if (error.response?.status === 429 && myCache.get(currency)) {
      // Return cached data with a note
      const cachedData = myCache.get(currency);
      return `${cachedData}\n\n⚠️ *Дані з кешу* (обмеження API)`;
    } else if (error.response?.status === 429) {
      console.log(error.message);
      return createErrorMessage(
        'API rate limit exceeded. Please try again later.',
        'currency'
      );
    }

    console.log(error.message);
    return createErrorMessage(error.message, 'currency');
  }
};

// Compare two currencies (USD vs EUR)
export const compareRates = async () => {
  try {
    const rateData = await axios(MONO_API_URL);

    const usdRate = rateData.data.find(
      item => item.currencyCodeA === 840 && item.currencyCodeB === 980
    );
    const eurRate = rateData.data.find(
      item => item.currencyCodeA === 978 && item.currencyCodeB === 980
    );

    if (!usdRate || !eurRate) {
      return createErrorMessage('Не вдалося знайти курси валют', 'currency');
    }

    // Validate required fields existence
    if (
      !usdRate.rateBuy ||
      !usdRate.rateSell ||
      !eurRate.rateBuy ||
      !eurRate.rateSell
    ) {
      return createErrorMessage('Неповні дані курсів валют', 'currency');
    }

    const usdToEur = (usdRate.rateSell / eurRate.rateBuy).toFixed(4);
    const eurToUsd = (eurRate.rateSell / usdRate.rateBuy).toFixed(4);

    return `${createHeader('ПОРІВНЯННЯ ВАЛЮТ', '💱')}

💵 *USD/UAH*
▫️ Покупка: *${usdRate.rateBuy} ₴*
▫️ Продаж: *${usdRate.rateSell} ₴*

💶 *EUR/UAH*  
▫️ Покупка: *${eurRate.rateBuy} ₴*
▫️ Продаж: *${eurRate.rateSell} ₴*

🔄 *Крос-курси:*
▫️ 1 USD = *${usdToEur} EUR*
▫️ 1 EUR = *${eurToUsd} USD*

📅 *Оновлено:* ${formatTime(usdRate.date)}

ℹ️ _Дані з MonoBank API_`;
  } catch (error) {
    console.log(error.message);
    return createErrorMessage(error.message, 'currency');
  }
};
