const express = require("express");

const path = require("path");

// Практична №14, варіант №3.
// Локальні демонстраційні записи настрою.
const moodEntries = [
    {
        id: 1,
        date: "2026-11-01",
        mood: 5,
        note: "Чудовий день."
    },
    {
        id: 2,
        date: "2026-11-02",
        mood: 4,
        note: "Гарний настрій."
    },
    {
        id: 3,
        date: "2026-11-03",
        mood: 3,
        note: "Звичайний день."
    },
    {
        id: 4,
        date: "2026-11-04",
        mood: 2,
        note: "Трохи втомився."
    },
    {
        id: 5,
        date: "2026-11-05",
        mood: 4,
        note: "Продуктивний день."
    },
    {
        id: 6,
        date: "2026-11-06",
        mood: 5,
        note: "Чудове самопочуття."
    },
    {
        id: 7,
        date: "2026-11-07",
        mood: 3,
        note: "Спокійний день."
    }
];

const app = express();

// Роздача статичних файлів попереднього застосунку.
app.use(express.static(path.join(__dirname, "..")));

// Отримання всіх або останніх N записів настрою.
app.get("/api/mood-entries", (req, res) => {
    const limit = req.query.limit;

    if (limit !== undefined) 
    {
        const count = Number(limit);

        if (
            typeof limit !== "string" ||
            !/^\d+$/.test(limit) ||
            !Number.isSafeInteger(count) ||
            count < 1
        ) 
        {
            return res.status(400).json({
                error: "Параметр limit має бути додатним цілим числом"
            });
        }

        return res.status(200).json(
            moodEntries.slice(-count)
        );
    }

    res.status(200).json(moodEntries);
});

// Обробка невідомих маршрутів.
app.use((req, res) => {
    res.status(404).json({
        error: "Ресурс не знайдено"
    });
});

 // Запуск локального сервера.
const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Сервер запущено: http://localhost:${PORT}`);
});