// scripts.js

// Функционал переключения темы
function initThemeSwitch() {
    const themeSwitch = document.createElement('div');
    themeSwitch.className = 'theme-switch';
    themeSwitch.innerHTML = '<div class="theme-switch-slider"></div>';
    document.body.appendChild(themeSwitch);

    // Проверяем сохраненную тему
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Обработчик клика по переключателю
    themeSwitch.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // Управление видимостью при прокрутке
    let lastScrollTop = 0;
    const scrollThreshold = 100; // Порог прокрутки для показа/скрытия

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
        
        if (currentScroll > lastScrollTop && currentScroll > scrollThreshold) {
            // Прокрутка вниз
            themeSwitch.classList.add('hidden');
        } else {
            // Прокрутка вверх
            themeSwitch.classList.remove('hidden');
        }
        
        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    }, { passive: true });
}

/**
 * Рассчитывает процент расхождения между текущей ценой и границами
 * @param {number} buyPrice - Цена покупки
 * @param {number} sellPrice - Цена продажи
 * @param {number} currentPrice - Текущая цена
 * @returns {string} Процент расхождения с 2 знаками после запятой или 'N/A'
 */
function calculateDifference(buyPrice, sellPrice, currentPrice) {
    if (currentPrice === undefined || currentPrice === null) 
        return {value: '', type: ''};
    
    // Если цена выше цены продажи - зеленый
    if (currentPrice > sellPrice) {
        const percent = (((currentPrice - sellPrice) / sellPrice) * 100).toFixed(2);
        return {value: percent, type: 'high'};
    }
    // Если цена ниже цены покупки - красный
    else if (currentPrice < buyPrice) {
        const percent = (((buyPrice - currentPrice) / buyPrice) * 100).toFixed(2);
        return {value: percent, type: 'low'};
    }
    // Если цена в пределах - пусто
    return {value: '', type: ''};
}

// Список популярных тикеров с их названиями
const stockSuggestions = [
    { ticker: 'SBER', name: 'Сбербанк' },
    { ticker: 'SBERP', name: 'Сбербанк-привилегированные' },
    { ticker: 'GAZP', name: 'Газпром' },
    { ticker: 'LKOH', name: 'Лукойл' },
    { ticker: 'YNDX', name: 'Яндекс' },
    { ticker: 'TCSG', name: 'TCS Group' },
    { ticker: 'ROSN', name: 'Роснефть' },
    { ticker: 'NVTK', name: 'Новатэк' },
    { ticker: 'ALRS', name: 'АЛРОСА' },
    { ticker: 'POLY', name: 'Polymetal' },
    { ticker: 'VTBR', name: 'ВТБ' },
    { ticker: 'PHOR', name: 'ФосАгро' },
    { ticker: 'PLZL', name: 'Полюс' },
    { ticker: 'TATN', name: 'Татнефть' },
    { ticker: 'RUAL', name: 'РУСАЛ' }
];

// Функция для фильтрации подсказок
function filterSuggestions(input) {
    const value = input.value.toUpperCase();
    return stockSuggestions.filter(stock => 
        stock.ticker.startsWith(value) || 
        stock.name.toUpperCase().includes(value)
    );
}

// Функция для отображения подсказок
function showSuggestions(input, suggestions) {
    const container = input.parentElement;
    const suggestionsDiv = container.querySelector('.autocomplete-suggestions');
    suggestionsDiv.innerHTML = '';
    
    if (suggestions.length === 0) {
        suggestionsDiv.style.display = 'none';
        return;
    }

    suggestions.forEach(suggestion => {
        const div = document.createElement('div');
        div.className = 'autocomplete-suggestion';
        div.innerHTML = `
            <span class="ticker">${suggestion.ticker}</span>
            <span class="name">${suggestion.name}</span>
        `;
        
        div.addEventListener('click', () => {
            input.value = suggestion.ticker;
            suggestionsDiv.style.display = 'none';
        });
        
        suggestionsDiv.appendChild(div);
    });
    
    suggestionsDiv.style.display = 'block';
}

// Инициализация автодополнения
function initAutocomplete() {
    const input = document.getElementById('ticker');
    let selectedIndex = -1;
    
    input.addEventListener('input', () => {
        const suggestions = filterSuggestions(input);
        showSuggestions(input, suggestions);
        selectedIndex = -1;
    });
    
    input.addEventListener('keydown', (e) => {
        const suggestionsDiv = input.parentElement.querySelector('.autocomplete-suggestions');
        const suggestions = suggestionsDiv.querySelectorAll('.autocomplete-suggestion');
        
        if (suggestions.length === 0) return;
        
        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0) {
                    suggestions[selectedIndex].click();
                }
                return;
            case 'Escape':
                suggestionsDiv.style.display = 'none';
                selectedIndex = -1;
                return;
        }
        
        suggestions.forEach((suggestion, index) => {
            suggestion.classList.toggle('selected', index === selectedIndex);
        });
    });
    
    // Закрытие подсказок при клике вне поля ввода
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !e.target.closest('.autocomplete-suggestions')) {
            input.parentElement.querySelector('.autocomplete-suggestions').style.display = 'none';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Инициализация переключателя темы
    initThemeSwitch();

    // Элементы DOM
    const addForm = document.getElementById('entering-data-form');
    const tableBody = document.getElementById('stock-table-body');
    let currentPrices = {};

    // Загрузка данных при старте
    loadData();

    // Обработчик формы добавления
    addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleAddStock();
    });

    // Функция загрузки данных
    async function loadData() {
        try {
            const [stocks, prices] = await Promise.all([
                fetch('/api/tracked-stocks').then(res => res.json()),
                fetch('/api/prices').then(res => res.json())
            ]);
            
            currentPrices = prices.prices || {};
            renderStockTable(stocks);
            startPriceUpdates();
        } catch (error) {
            console.error('Ошибка загрузки:', error);
        }
    }

    // Функция обновления цен
    function startPriceUpdates() {
        setInterval(async () => {
            try {
                const response = await fetch('/api/prices');
                const { prices } = await response.json();
                currentPrices = prices || {};
            
                document.querySelectorAll('.price-cell').forEach(cell => {
                    const ticker = cell.dataset.ticker;
                    const price = currentPrices[ticker];
                    cell.textContent = price ?? 'N/A';
                
                    const row = cell.closest('tr');
                    updateRowStyle(row, ticker);
                
                    // Обновляем процент расхождения
                    const buyPrice = parseFloat(row.children[1].textContent);
                    const sellPrice = parseFloat(row.children[2].textContent);
                    const currentPrice = price ? parseFloat(price) : null;
                    const diffCell = row.querySelector('.difference-cell');
                    const diff = calculateDifference(buyPrice, sellPrice, currentPrice);
                
                    // Обновляем классы и значение
                    diffCell.className = `difference-cell ${diff.type}-difference`;
                    diffCell.textContent = diff.value ? `${diff.value}%` : '';
                });
            } catch (error) {
                console.error('Ошибка обновления цен:', error);
            }
        }, 9000);
    }

    // Обработка добавления акции
    async function handleAddStock() {
        const formData = new FormData(addForm);
        
        try {
            const response = await fetch('/api/stock-alerts', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            alert(data.success ? "Акция добавлена" : data.error || "Ошибка");
            if (data.success) {
                addForm.reset();
                loadData();
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert("Ошибка при добавлении акции");
        }
    }

    // Функция для создания SVG графика
    function createStockChart(prices) {
        if (!prices || prices.length < 2) return '';
        
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "chart-line");
        svg.setAttribute("viewBox", "0 0 100 40");
        svg.setAttribute("preserveAspectRatio", "none");
        
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        
        // Нормализуем цены для отображения
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const range = max - min || 1; // Защита от деления на ноль
        
        const points = prices.map((price, i) => {
            const x = (i / (prices.length - 1)) * 100;
            const y = 40 - ((price - min) / range) * 35; // Оставляем отступ 5px сверху и снизу
            return `${x},${y}`;
        });
        
        path.setAttribute("d", `M ${points.join(' L ')}`);
        svg.appendChild(path);
        
        return svg.outerHTML;
    }

    // Функция для загрузки исторических данных
    async function loadStockHistory(ticker) {
        try {
            const response = await fetch(`/api/stock-history/${ticker}`);
            if (!response.ok) throw new Error('Ошибка загрузки данных');
            const data = await response.json();
            return data.prices;
        } catch (error) {
            console.error('Ошибка загрузки исторических данных:', error);
            return null;
        }
    }

    // Модифицируем функцию renderStockTable
    function renderStockTable(stocks) {
        tableBody.innerHTML = stocks.map(stock => {
            const currentPrice = currentPrices[stock.ticker];
            const diff = calculateDifference(
                parseFloat(stock.buy_price),
                parseFloat(stock.sell_price),
                currentPrice ? parseFloat(currentPrice) : null
            );

            return `
            <tr>
                <td>
                    <div class="chart-container">
                        <div class="stock-chart" id="chart-${stock.ticker}">
                            <!-- График будет добавлен асинхронно -->
                        </div>
                        ${stock.ticker}
                    </div>
                </td>
                <td>${stock.buy_price}</td>
                <td>${stock.sell_price}</td>
                <td class="price-cell" data-ticker="${stock.ticker}">
                    ${currentPrice ?? 'N/A'}
                </td>
                <td class="difference-cell ${diff.type}-difference" data-ticker="${stock.ticker}">
                    ${diff.value ? `${diff.value}%` : ''}
                </td>
                <td class="status-cell">
                    ${getStatus(stock, currentPrices)}
                </td>
                <td>
                    <button class="delete-stock-btn" 
                            data-ticker="${stock.ticker}" 
                            title="Удалить акцию ${stock.ticker}">
                    </button>
                </td>
            </tr>
            `;
        }).join('');

        // Загружаем графики для каждой акции
        stocks.forEach(async stock => {
            const prices = await loadStockHistory(stock.ticker);
            if (prices) {
                const chartContainer = document.getElementById(`chart-${stock.ticker}`);
                if (chartContainer) {
                    chartContainer.innerHTML = createStockChart(prices);
                }
            }
        });

        // Добавляем обработчики для кнопок удаления
        document.querySelectorAll('.delete-stock-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const ticker = e.target.closest('.delete-stock-btn').dataset.ticker;
                if (confirm(`Вы уверены, что хотите удалить акцию ${ticker}?`)) {
                    await handleDeleteStock(ticker);
                }
            });
        });

        // Обновление стилей
        document.querySelectorAll('#stock-table-body tr').forEach(row => {
            const ticker = row.querySelector('.price-cell').dataset.ticker;
            updateRowStyle(row, ticker);
        });
    }

    // Обработка удаления акции
    async function handleDeleteStock(ticker) {
        try {
            const response = await fetch(`/api/stock-alerts/${ticker}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            if (data.success) {
                loadData(); // Перезагружаем таблицу
            } else {
                alert("Ошибка при удалении акции");
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert("Ошибка при удалении акции");
        }
    }

    // Функция для форматирования чисел
    const formatNumber = (num) => {
        if (num === undefined || num === null) return 'N/A';
        const str = num.toString();
        return str.includes('.') ? str.replace(/\.?0+$/, '') : str;
    };

    // Определение статуса
    function getStatus(stock, prices) {
        const price = prices[stock.ticker];
        if (!price) return '';
        
        const buyPrice = parseFloat(stock.buy_price);
        const sellPrice = parseFloat(stock.sell_price);
        
        if (price <= buyPrice) return 'Покупка';
        if (price >= sellPrice) return 'Продажа';
        return '';
    }

    // Функция для точного сравнения цен
    function comparePrices(price1, price2) {
        const num1 = typeof price1 === 'string' ? parseFloat(price1) : price1;
        const num2 = typeof price2 === 'string' ? parseFloat(price2) : price2;
        return { num1, num2 };
    }

    // Обновление стилей строки
    function updateRowStyle(row, ticker) {
        const priceCell = row.querySelector('.price-cell');
        const statusCell = row.querySelector('.status-cell');
        const diffCell = row.querySelector('.difference-cell'); // Новая ячейка
        const price = currentPrices[ticker];
    
        // Сброс стилей
        priceCell.className = 'price-cell';
        statusCell.className = 'status-cell';
        diffCell.className = 'difference-cell';
    
        if (!price) return;
    
        const buyPrice = parseFloat(row.children[1].textContent);
        const sellPrice = parseFloat(row.children[2].textContent);
        const currentPrice = parseFloat(price);
    
        if (currentPrice <= buyPrice) {
            priceCell.classList.add('price-low');
            statusCell.classList.add('status-buy');
            statusCell.textContent = 'Покупка';
            diffCell.classList.add('difference-low'); // Стиль для снижения цены
        } else if (currentPrice >= sellPrice) {
            priceCell.classList.add('price-high');
            statusCell.classList.add('status-sell');
            statusCell.textContent = 'Продажа';
            diffCell.classList.add('difference-high'); // Стиль для превышения цены
        }
    }

    // Обработка отправки формы
    const form = document.getElementById('addStockForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const ticker = document.getElementById('ticker').value.toUpperCase();
        const buyPrice = parseFloat(document.getElementById('buyPrice').value);
        const sellPrice = parseFloat(document.getElementById('sellPrice').value);
        
        try {
            const response = await fetch('/add_stock', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ticker: ticker,
                    buy_price: buyPrice,
                    sell_price: sellPrice
                })
            });
            
            if (response.ok) {
                form.reset();
                loadData();
            } else {
                alert('Ошибка при добавлении акции');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка при добавлении акции');
        }
    });
    
    // Загрузка списка акций при загрузке страницы
    loadData();
    
    // Обновление списка акций каждые 5 секунд
    setInterval(loadData, 5000);
});