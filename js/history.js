import { db, collection, getDocs, deleteDoc, doc, query, orderBy, onSnapshot } from './firebase.js';

(function() {
    const tableBody = document.getElementById('tableBody');
    const searchInput = document.getElementById('searchInput');
    const statsEl = document.getElementById('stats');
    
    let allMeasurements = [];
    let currentSearchTerm = '';

    const measurementsCollection = collection(db, 'measurements');

    // ===== ЗАГРУЗКА ДАННЫХ =====
    async function loadMeasurements() {
        try {
            console.log('Загружаем измерения...');
            const q = query(measurementsCollection, orderBy('date', 'desc'));
            const querySnapshot = await getDocs(q);
            
            allMeasurements = querySnapshot.docs.map(doc => {
                const data = doc.data();
                console.log('Загружен документ:', doc.id, data);
                return {
                    id: doc.id,
                    ...data
                };
            });
            
            console.log('Всего загружено:', allMeasurements.length);
            renderTable();
            updateStats();
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            showError('Не удалось загрузить данные: ' + error.message);
        }
    }

    // ===== ОТОБРАЖЕНИЕ ТАБЛИЦЫ =====
    function renderTable() {
        if (!tableBody) {
            console.error('tableBody не найден');
            return;
        }
        
        const filtered = filterMeasurements(allMeasurements, currentSearchTerm);
        console.log('Отображаем записей:', filtered.length);

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 2rem; color: #7f8c8d;">
                        ${allMeasurements.length === 0 ? '📭 Нет сохраненных замеров' : '🔍 Ничего не найдено'}
                    </td>
                </tr>
            `;
        } else {
            tableBody.innerHTML = filtered.map(m => `
                <tr>
                    <td>${new Date(m.date).toLocaleString()}</td>
                    <td><strong>${m.kp?.toFixed(4) || '0'}</strong></td>
                    <td>${m.wAct?.toFixed(3) || '0'}</td>
                    <td>${m.lAct?.toFixed(1) || '0'}</td>
                    <td>${m.sAct?.toFixed(2) || '0'}</td>
                    <td>${m.w2Act?.toFixed(4) || '0'}</td>
                    <td>${escapeHtml(m.compoundName || 'Не выбрана')}</td>
                    <td>${escapeHtml(m.profileName || 'Не выбрана')}</td>
                    <td>
                        <button onclick="deleteMeasurement('${m.id}')" style="background: #e74c3c; color: white; border: none; padding: 0.3rem 0.8rem; border-radius: 4px; cursor: pointer;">🗑️</button>
                    </td>
                </tr>
            `).join('');
        }
    }

    // ===== ФИЛЬТРАЦИЯ =====
    function filterMeasurements(measurements, searchTerm) {
        if (!searchTerm) return measurements;
        const term = searchTerm.toLowerCase();
        return measurements.filter(m => 
            new Date(m.date).toLocaleString().toLowerCase().includes(term) ||
            m.kp?.toString().includes(term) ||
            (m.compoundName && m.compoundName.toLowerCase().includes(term)) ||
            (m.profileName && m.profileName.toLowerCase().includes(term))
        );
    }

    // ===== УДАЛЕНИЕ =====
    window.deleteMeasurement = async function(measurementId) {
        if (!confirm('Удалить этот замер?')) return;

        try {
            const measurementRef = doc(db, 'measurements', measurementId);
            await deleteDoc(measurementRef);
            loadMeasurements();
        } catch (error) {
            console.error('Ошибка удаления:', error);
            alert('Не удалось удалить данные');
        }
    };

    // ===== ВСПОМОГАТЕЛЬНЫЕ =====
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showError(message) {
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 2rem; color: #e74c3c;">
                        ❌ ${message}
                    </td>
                </tr>
            `;
        }
    }

    function updateStats() {
        if (statsEl) {
            const filtered = filterMeasurements(allMeasurements, currentSearchTerm);
            statsEl.textContent = `Всего: ${filtered.length} из ${allMeasurements.length}`;
        }
    }

    // ===== СЛУШАЕМ ИЗМЕНЕНИЯ =====
    function subscribeToChanges() {
        const q = query(measurementsCollection, orderBy('date', 'desc'));
        onSnapshot(q, (snapshot) => {
            console.log('🔄 Данные изменились, обновляем...');
            loadMeasurements();
        });
    }

    // ===== ПОИСК =====
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value;
            renderTable();
            updateStats();
        });
    }

    // ===== ЗАПУСК =====
    document.addEventListener('DOMContentLoaded', () => {
        console.log('history.js загружен');
        loadMeasurements();
        subscribeToChanges();
    });
})();