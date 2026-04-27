# RefurbChain — прототип блокчейн-паспорта б/у электроники

## Что внутри
- `contracts/` — Solidity смарт-контракт реестра.
- `scripts/deploy.js` — деплой и экспорт ABI/адреса.
- `test/` — тесты Hardhat.
- `backend/` — Express API.
- `frontend/` — React/Vite UI.
- `docs/architecture.md` — архитектурное описание.

## Требования
- Node.js 20+
- npm 10+

## Установка
```bash
cd output/refurbchain
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

## Запуск
Открой 4 терминала.

### Терминал 1 — локальный блокчейн
```bash
cd output/refurbchain
npx hardhat node
```

### Терминал 2 — деплой контракта
```bash
cd output/refurbchain
npx hardhat run scripts/deploy.js --network localhost
```

После этого появятся:
- `backend/contract-config.json`
- `frontend/src/contract-config.json`

### Терминал 3 — backend
```bash
cd output/refurbchain/backend
npm run dev
```
Backend будет на `http://localhost:3001`.

### Терминал 4 — frontend
```bash
cd output/refurbchain/frontend
npm run dev
```
Frontend обычно будет на `http://localhost:5173`.

## Как проверить
1. Открой главную страницу frontend.
2. Нажми `Создать паспорт` с демо-данными.
3. Увидишь `reportId`, `deviceHash`, `reportHash`, tx hash и QR.
4. Открой страницу проверки по ссылке или QR.
5. Убедись, что видны статус, диагностика и хэш отчёта.

## Для демонстрации можно проверить:
1. Добавлен доверенный сервис при деплое.
2. Неавторизованный адрес не может вызвать `registerReport` — см. тесты.
3. Отчёт попадает в блокчейн, а детали хранятся off-chain.
4. Покупатель проверяет паспорт через QR.

## Запуск тестов
```bash
cd output/refurbchain
npx hardhat test
```

## Что (возможно) будет сделано позже
- Авторизация через MetaMask.
- SQLite/PostgreSQL вместо JSON.
- Несколько сервисных центров.
- Ревокация конкретных отчётов.
- Проверка совпадения текущего JSON и on-chain reportHash через отдельную кнопку.
