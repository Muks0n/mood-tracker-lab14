
const STORAGE_MODE = "indexed";

// Практична №14: локальний API на Node.js.
const API_URL = "/api/mood-entries";

// Практична №12: анімований графік останніх 7 записів.
const CHART_RECORD_COUNT = 7;
let chartAnimationId = null;

function drawMoodChart(records)
{
    const canvas = document.getElementById("mood-canvas");

    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (chartAnimationId !== null)
    {
        cancelAnimationFrame(chartAnimationId);
        chartAnimationId = null;
    }

    const lastRecords = records.slice(-CHART_RECORD_COUNT);

    const left = 50;
    const right = canvas.width - 30;
    const top = 30;
    const bottom = canvas.height - 45;

    const points = lastRecords.map((record, index) => ({
        x: left + index * (right - left) /
            Math.max(lastRecords.length - 1, 1),

        y: bottom - (record.mood - 1) *
            (bottom - top) / 4
    }));

    let startTime = null;

    function animate(timestamp)
    {
        if (startTime === null)
        {
            startTime = timestamp;
        }

        const progress = Math.min(
            (timestamp - startTime) / 1000,
            1
        );

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Осі графіка.
        ctx.strokeStyle = "#66577a";
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(left, top);
        ctx.lineTo(left, bottom);
        ctx.lineTo(right, bottom);
        ctx.stroke();

        // Позначення рівнів настрою.
        ctx.fillStyle = "#403b43";
        ctx.font = "14px Arial";

        for (let mood = 1; mood <= 5; mood++)
        {
            const y = bottom -
                (mood - 1) * (bottom - top) / 4;

            ctx.fillText(String(mood), left - 25, y + 5);
        }

        // Номери записів.
        points.forEach((point, index) => {
            ctx.fillText(
                String(index + 1),
                point.x - 4,
                bottom + 22
            );
        });

        // Анімоване промальовування.
        if (points.length > 1)
        {
            ctx.strokeStyle = "#66577a";
            ctx.lineWidth = 3;

            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);

            const position =
                progress * (points.length - 1);

            const completed = Math.floor(position);

            for (let i = 1; i <= completed; i++)
            {
                ctx.lineTo(points[i].x, points[i].y);
            }

            if (progress < 1)
            {
                const current = points[completed];
                const next = points[completed + 1];
                const fraction = position - completed;

                ctx.lineTo(
                    current.x +
                        (next.x - current.x) * fraction,
                    current.y +
                        (next.y - current.y) * fraction
                );
            }

            ctx.stroke();
        }
        else if (points.length === 1)
        {
            ctx.beginPath();
            ctx.arc(
                points[0].x,
                points[0].y,
                4,
                0,
                2 * Math.PI
            );
            ctx.fillStyle = "#66577a";
            ctx.fill();
        }

        if (progress < 1)
        {
            chartAnimationId = requestAnimationFrame(animate);
        }
        else
        {
            chartAnimationId = null;
        }
    }

    chartAnimationId = requestAnimationFrame(animate);
}


// Практична №13, крок 5:
// View-функції вибирають представлення.
// Vue автоматично розмонтовує попередній компонент
// і монтує новий у спільному контейнері router-view.

function renderHome(vm)
{
    vm.currentView = "home";
    vm.selectedId = null;
}

function renderHistory(vm)
{
    vm.currentView = "history";
    vm.selectedId = null;
}

function renderStats(vm)
{
    vm.currentView = "stats";
    vm.selectedId = null;
}

function renderDetail(vm, params)
{
    vm.selectedId = Number(params.id);
    vm.currentView = "detail";
}


// таблиця маршрутів.
const routes = [
    { path: "/", view: renderHome },
    { path: "/history", view: renderHistory },
    { path: "/stats", view: renderStats },
    { path: "/history/:id", view: renderDetail }
];


// пошук маршруту та отримання параметрів.
function matchRoute(path)
{
    const pathParts = path.split("/").filter(Boolean);

    for (const route of routes)
    {
        const routeParts =
            route.path.split("/").filter(Boolean);

        if (routeParts.length !== pathParts.length)
        {
            continue;
        }

        const params = {};

        const matched = routeParts.every((part, index) => {
            if (part.startsWith(":"))
            {
                params[part.slice(1)] = pathParts[index];
                return true;
            }

            return part === pathParts[index];
        });

        if (matched)
        {
            return {
                view: route.view,
                params: params
            };
        }
    }

    return null;
}


// клієнтська навігація.
function navigate(path)
{
    if (location.hash.slice(1) === path)
    {
        return;
    }

    location.hash = path;
}


// Практична №10: компонент запису настрою.
const MoodEntry = {
    props: {
        id: {
            type: Number,
            required: true
        },

        date: {
            type: String,
            required: true
        },

        mood: {
            type: Number,
            required: true
        },

        note: {
            type: String,
            default: ""
        }
    },

    emits: ["edit", "delete"],

    computed: {
        moodEmoji()
        {
            const emoji = {
                1: "😢",
                2: "😔",
                3: "😐",
                4: "🙂",
                5: "😄"
            };

            return emoji[this.mood] || "❔";
        },

        moodLabel()
        {
            const labels = {
                1: "Дуже сумний",
                2: "Сумний",
                3: "Нейтральний",
                4: "Задовільний",
                5: "Щасливий"
            };

            return labels[this.mood] || "Невідомий";
        }
    },

    template: `
        <article
            class="mood-card"
            :class="[
                'mood-card-' + mood,
                mood >= 4 ? 'good' : 'hard'
            ]"
            :data-mood="mood"
        >
            <h3>
                Дата: {{ date }}

                <span
                    class="mood-emoji"
                    :aria-label="moodLabel"
                >
                    {{ moodEmoji }}
                </span>
            </h3>

            <p>
                Настрій: {{ moodLabel }}. {{ note }}
            </p>

            <div class="record-actions">
                <button
                    type="button"
                    @click="$emit('edit', id)"
                >
                    Редагувати
                </button>

                <button
                    type="button"
                    @click="$emit('delete', id)"
                >
                    Видалити
                </button>
            </div>
        </article>
    `
};


// повторне використання HTML-шаблонів.
// Спільні дані передаються через props,
// а дії користувача — через події.

const sharedProps = {
    moodRecords: {
        type: Array,
        default: () => []
    },

    selectedRecord: {
        type: Object,
        default: null
    },

    averageMood: {
        type: Number,
        default: 0
    },

    editingId: {
        type: Number,
        default: null
    },

    newDate: {
        type: String,
        default: ""
    },

    newMood: {
        type: [String, Number],
        default: ""
    },

    newNote: {
        type: String,
        default: ""
    },

    storageReady: {
        type: Boolean,
        default: false
    },

    storageError: {
        type: String,
        default: ""
    },

    apiRecords: {
        type: Array,
        default: () => []
    },

    isLoading: {
        type: Boolean,
        default: false
    },

    errorMessage: {
        type: String,
        default: ""
    }
};

const sharedEmits = [
    "save",
    "edit",
    "delete",
    "cancel-edit",
    "load-data",
    "update:newDate",
    "update:newMood",
    "update:newNote"
];

function createView(templateId)
{
    return {
        template: "#" + templateId,
        components: {
            MoodEntry
        },
        props: sharedProps,
        emits: sharedEmits
    };
}

const HomeView =
    createView("home-view-template");

const HistoryView =
    createView("history-view-template");

const DetailView =
    createView("detail-view-template");

const StatsView =
    createView("stats-view-template");

const NotFoundView =
    createView("not-found-view-template");


// Головний Vue-застосунок.
const app = Vue.createApp({
    components: {
        MoodEntry,
        HomeView,
        HistoryView,
        DetailView,
        StatsView,
        NotFoundView
    },

    data()
    {
        return {
            moodRecords: [],

            currentView: "home",
            selectedId: null,

            editingId: null,

            newDate: "",
            newMood: "",
            newNote: "",

            storageReady: false,
            storageError: "",

            apiRecords: [],
            isLoading: false,
            errorMessage: ""
        };
    },

    computed: {
        // активний компонент визначає
        // вміст спільного контейнера router-view.
        currentViewComponent()
        {
            const views = {
                home: "HomeView",
                history: "HistoryView",
                stats: "StatsView",
                detail: "DetailView",
                notFound: "NotFoundView"
            };

            return views[this.currentView] || "NotFoundView";
        },

        selectedRecord()
        {
            return this.moodRecords.find(
                item => item.id === this.selectedId
            ) || null;
        },

        averageMood()
        {
            if (this.moodRecords.length === 0)
            {
                return 0;
            }

            const sum = this.moodRecords.reduce(
                (total, record) => total + Number(record.mood),
                0
            );

            return sum / this.moodRecords.length;
        }
    },

    watch: {
        // Практична №12: оновлення графіка.
        moodRecords: {
            handler(newRecords)
            {
                if (this.currentView === "stats")
                {
                    this.$nextTick(() => {
                        drawMoodChart(newRecords);
                    });
                }
            },

            deep: true
        }
    },

    methods: {
        // вибір представлення.
        renderRoute()
        {
            const path = location.hash.slice(1) || "/";
            const matched = matchRoute(path);

            if (matched)
            {
                matched.view(this, matched.params);
            }
            else
            {
                this.currentView = "notFound";
                this.selectedId = null;
            }

            if (this.currentView === "stats")
            {
                this.$nextTick(() => {
                    drawMoodChart(this.moodRecords);
                });
            }
            else if (chartAnimationId !== null)
            {
                cancelAnimationFrame(chartAnimationId);
                chartAnimationId = null;
            }
        },

        // Практична №11: збереження або оновлення.
        async saveMoodRecord()
        {
            if (!this.storageReady)
            {
                return;
            }

            const mood = Number(this.newMood);

            if (
                !this.newDate ||
                !Number.isInteger(mood) ||
                mood < 1 ||
                mood > 5
            )
            {
                return;
            }

            const record = {
                date: this.newDate,
                mood: mood,
                note: this.newNote.trim()
            };

            this.storageReady = false;
            this.storageError = "";

            try
            {
                if (STORAGE_MODE === "local")
                {
                    if (this.editingId === null)
                    {
                        const maxId = Math.max(
                            0,
                            ...this.moodRecords.map(
                                item => item.id
                            )
                        );

                        record.id = maxId + 1;
                        this.moodRecords.push(record);
                    }
                    else
                    {
                        record.id = this.editingId;

                        const index =
                            this.moodRecords.findIndex(
                                item => item.id === this.editingId
                            );

                        if (index !== -1)
                        {
                            this.moodRecords[index] = record;
                        }
                    }

                    saveToLocalStorage(this.moodRecords);
                }
                else
                {
                    if (this.editingId === null)
                    {
                        await addItem(record);
                    }
                    else
                    {
                        record.id = this.editingId;
                        await updateItem(record);
                    }

                    this.moodRecords = await getAllItems();
                }

                this.cancelEditing();
            }
            catch (error)
            {
                this.storageError =
                    "Не вдалося зберегти запис.";

                console.error(error);

                if (STORAGE_MODE === "local")
                {
                    this.moodRecords = loadFromLocalStorage();
                }
            }
            finally
            {
                this.storageReady = true;
            }
        },

        // Практична №11: початок редагування.
        startEditing(id)
        {
            const record = this.moodRecords.find(
                item => item.id === id
            );

            if (!record)
            {
                return;
            }

            this.editingId = id;
            this.newDate = record.date;
            this.newMood = String(record.mood);
            this.newNote = record.note;

            renderHome(this);
            navigate("/");

            this.$nextTick(() => {
                const form = document.getElementById(
                    "mood-tracker"
                );

                if (form)
                {
                    form.scrollIntoView({
                        behavior: "smooth"
                    });
                }
            });
        },

        cancelEditing()
        {
            this.editingId = null;
            this.newDate = "";
            this.newMood = "";
            this.newNote = "";
        },

        // Практична №11: видалення запису.
        async removeMoodRecord(id)
        {
            if (!this.storageReady)
            {
                return;
            }

            this.storageReady = false;
            this.storageError = "";

            try
            {
                if (STORAGE_MODE === "local")
                {
                    this.moodRecords =
                        this.moodRecords.filter(
                            item => item.id !== id
                        );

                    saveToLocalStorage(this.moodRecords);
                }
                else
                {
                    await deleteItem(id);
                    this.moodRecords = await getAllItems();
                }

                if (this.editingId === id)
                {
                    this.cancelEditing();
                }

                if (
                    this.currentView === "detail" &&
                    this.selectedId === id
                )
                {
                    navigate("/history");
                }
            }
            catch (error)
            {
                this.storageError =
                    "Не вдалося видалити запис.";

                console.error(error);

                if (STORAGE_MODE === "local")
                {
                    this.moodRecords = loadFromLocalStorage();
                }
            }
            finally
            {
                this.storageReady = true;
            }
        },

        // Практична №11: завантаження збережених даних.
        async loadSavedMoodRecords()
        {
            this.storageReady = false;
            this.storageError = "";

            try
            {
                if (STORAGE_MODE === "local")
                {
                    const saved = localStorage.getItem(
                        LOCAL_STORAGE_KEY
                    );

                    if (saved === null)
                    {
                        saveToLocalStorage(
                            INITIAL_MOOD_RECORDS
                        );
                    }

                    this.moodRecords =
                        loadFromLocalStorage();
                }
                else
                {
                    this.moodRecords =
                        await initializeStorage();
                }

                this.storageReady = true;
            }
            catch (error)
            {
                this.storageError =
                    "Не вдалося відкрити сховище даних. " +
                    "Перевірте доступність IndexedDB у браузері.";

                console.error(error);
            }
        },

        // Практична №9: завантаження через Fetch API.
        async loadData()
        {
            this.isLoading = true;
            this.errorMessage = "";

            try
            {
                const response = await fetch(API_URL);

                if (!response.ok)
                {
                    throw new Error(
                        "Сервер відповів кодом " +
                        response.status
                    );
                }

                const data = await response.json();

                if (!Array.isArray(data))
                {
                    throw new Error(
                        "Некоректний формат даних API"
                    );
                }

                this.apiRecords = data;
                console.log(data);
            }
            catch (error)
            {
                this.errorMessage =
                    "Записи тимчасово недоступні";

                console.error(error);
            }
            finally
            {
                this.isLoading = false;
            }
        }
    },

    mounted()
    {
        // обробка hashchange.
        this.routeHandler = () => {
            this.renderRoute();
        };

        window.addEventListener(
            "hashchange",
            this.routeHandler
        );

        // перехоплення внутрішніх посилань.
        this.linkHandler = (event) => {
            const target = event.target;

            if (!(target instanceof Element))
            {
                return;
            }

            const link = target.closest("a[data-link]");

            if (!link)
            {
                return;
            }

            event.preventDefault();

            navigate(
                link.getAttribute("href").slice(1)
            );
        };

        document.addEventListener(
            "click",
            this.linkHandler
        );

        this.renderRoute();
        this.loadSavedMoodRecords();
        this.loadData();
    },

    beforeUnmount()
    {
        window.removeEventListener(
            "hashchange",
            this.routeHandler
        );

        document.removeEventListener(
            "click",
            this.linkHandler
        );

        if (chartAnimationId !== null)
        {
            cancelAnimationFrame(chartAnimationId);
            chartAnimationId = null;
        }
    }
});

app.mount("#app");
