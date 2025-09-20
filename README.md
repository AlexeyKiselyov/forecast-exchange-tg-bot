<h1 align="center">Telegram Bot: Exchange Rates & Weather Forecast</h1>

## 📋 Description

Telegram bot that provides currency rates and weather forecast:

- USD/UAH and EUR/UAH from Monobank, USD ↔ EUR comparison
- Weather forecast every 3/6 hours and wind details (OpenWeatherMap)
- Inline menus, quick actions, city selection and manual input
- Visually centered headers with a decorative underline

Message language: Ukrainian.

## 🚀 Quick Start

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

- Copy `.env.example` to `.env`
- Fill the values (see the table below)

3. Start the bot:

```bash
npm start
```

## 🔧 Environment Variables

| Variable              | Purpose                                         | Required | Default |
| --------------------- | ----------------------------------------------- | -------- | ------- |
| `TG_BOT_TOKEN`        | Telegram bot token (@BotFather)                 | yes      | —       |
| `WEATHER_API_KEY`     | OpenWeatherMap API key                          | yes      | —       |
| `CITY`                | Default city for forecast                       | no       | `Kyiv`  |
| `HEADER_TARGET_WIDTH` | Header centering width (24–40, affects visuals) | no       | `32`    |

Notes:

- `CITY` is used for the quick forecast; the city can also be changed from the bot menu.
- `HEADER_TARGET_WIDTH` helps visual centering on wide chat windows (desktop): try 36–40 if it looks left-shifted.

## ⚡ Features

Currency (Monobank):

- USD/UAH and EUR/UAH
- USD ↔ EUR cross-rate comparison
- Refresh rates, soft rate-limit handling (429) via cache

Weather (OpenWeatherMap):

- Intervals: every 3 hours / 6 hours
- Dedicated “Wind 💨” mode
- Quick forecast (next 3 items)
- City selection list + manual input

Navigation & UX:

- Inline menus: Weather, Currency, About, Back, Home
- Commands: `/start`, `/help`, `/weather`, `/rates`
- Per-user saved default city

Visual headers:

- Centered using invisible U+2800 characters and Markdown (**bold**)
- Decorative underline matching the header width
- Works with `parse_mode: Markdown` (no HTML required)

Caveats:

- Telegram has no true text centering; this is visual centering and may vary across clients. Tune `HEADER_TARGET_WIDTH` for your client.

## 📁 Project Structure

```
forecast-exchange-tg-bot/
├── helpers/
│   ├── buttonsOptions.js      # Inline keyboards and menus
│   ├── constants.js           # Env variables & API URLs
│   ├── getDate.js             # Date formatting utilities (if used)
│   ├── getForecast.js         # Weather fetching & formatting
│   ├── getRate.js             # Rates and comparison
│   └── messageFormatter.js    # Emojis, headers, cards, formatters
├── ratesTgBot.js              # Main bot application
├── package.json               # Scripts & dependencies
├── .env                       # Local environment variables
├── .env.example               # Env template
└── README.md                  # Documentation
```

## 🧠 Technical Notes

- Bot uses `node-telegram-bot-api` (polling)
- Message formatting uses `Markdown`
- Rates are cached (NodeCache); on 429, cached values are returned with a note
- Headers are built via `createHeader(title, emoji, decorative = true)`
  - Width is configurable using `HEADER_TARGET_WIDTH`
  - Decorative underline can be disabled via the third argument (`false`)

## 🔒 Security

- Keep tokens and keys only in `.env`
- `.env` is git-ignored
- Use `.env.example` as a template

---

Author: [Oleksii Kysel'ov](https://www.linkedin.com/in/olexiy-kiselyov/)
