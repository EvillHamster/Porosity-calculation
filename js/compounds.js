// ============================================
// js/compounds.js - УПРАВЛЕНИЕ СМЕСЯМИ
// ============================================

import { 
    compoundsCollection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    onSnapshot,
    db  // ← ДОБАВИЛ ЭТОТ ИМПОРТ!
} from './firebase.js';

(function() {
    const tableBody = document.getElementById('tableBody');
    const searchInput = document.getElementById('searchInput');
    const statsEl = document.getElementById('stats');
    const modal = document.getElementById('modal');
    
    let allCompounds = [];
    let currentSearchTerm = '';

    // ===== ЗАГРУЗКА ДАННЫХ =====
    async function loadCompounds() {
        try {
            const q = query(compoundsCollection, orderBy('name'));
            const querySnapshot = await getDocs(q);
            
            allCompounds = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            renderTable();
            updateStats();
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            showError('Не удалось загрузить данные');
        }
    }

    // ===== ОТОБРАЖЕНИЕ ТАБЛИЦЫ =====
    function renderTable() {
        if (!tableBody) return;
        
        const filtered = filterCompounds(allCompounds, currentSearchTerm);

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 2rem; color: #7f8c8d;">
                        ${allCompounds.length === 0 ? '📭 Нет сохраненных смесей. Нажмите "Новая смесь" для добавления.' : '🔍 Ничего не найдено'}
                    </td>
                </tr>
            `;
        } else {
            tableBody.innerHTML = filtered.map(compound => `
                <tr>
                    <td><strong>${escapeHtml(compound.name)}</strong></td>
                    <td><span style="background: #e8f5e9; padding: 0.3rem 0.8rem; border-radius: 12px;">${compound.density?.toFixed(4)}</span></td>
                    <td>${compound.created ? new Date(compound.created).toLocaleDateString() : '-'}</td>
                    <td>
                        <button onclick="editCompound('${compound.id}')" style="background: #f39c12; color: white; border: none; padding: 0.3rem 0.8rem; border-radius: 4px; cursor: pointer; margin-right: 0.3rem;">✏️</button>
                        <button onclick="deleteCompound('${compound.id}')" style="background: #e74c3c; color: white; border: none; padding: 0.3rem 0.8rem; border-radius: 4px; cursor: pointer;">🗑️</button>
                    </td>
                </tr>
            `).join('');
        }
    }

    // ===== ФИЛЬТРАЦИЯ =====
    function filterCompounds(compounds, searchTerm) {
        if (!searchTerm) return compounds;
        const term = searchTerm.toLowerCase();
        return compounds.filter(c => 
            c.name.toLowerCase().includes(term) ||
            c.density?.toString().includes(term)
        );
    }

    // ===== ДОБАВЛЕНИЕ/РЕДАКТИРОВАНИЕ =====
    window.showAddModal = function(compoundId = null) {
        const modal = document.getElementById('modal');
        const title = document.getElementById('modalTitle');
        
        document.getElementById('modalName').value = '';
        document.getElementById('modalDensity').value = '';
        document.getElementById('modalError').textContent = '';
        
        if (compoundId) {
            const compound = allCompounds.find(c => c.id === compoundId);
            if (compound) {
                title.textContent = 'Редактировать смесь';
                document.getElementById('modalName').value = compound.name || '';
                document.getElementById('modalDensity').value = compound.density || '';
                modal.dataset.editId = compoundId;
            }
        } else {
            title.textContent = 'Добавить смесь';
            delete modal.dataset.editId;
        }
        
        modal.style.display = 'flex';
    };

    window.hideModal = function() {
        document.getElementById('modal').style.display = 'none';
    };

    window.saveCompound = async function() {
        const name = document.getElementById('modalName').value.trim();
        const density = parseFloat(document.getElementById('modalDensity').value);
        const errorEl = document.getElementById('modalError');
        const editId = document.getElementById('modal')?.dataset?.editId;

        if (!name) {
            errorEl.textContent = 'Введите название смеси';
            return;
        }
        if (isNaN(density) || density <= 0) {
            errorEl.textContent = 'Введите корректную плотность';
            return;
        }

        try {
            const compoundData = {
                name: name,
                density: density,
                lastModified: new Date().toISOString()
            };

            if (editId) {
                const compoundRef = doc(db, 'compounds', editId);
                await updateDoc(compoundRef, compoundData);
            } else {
                compoundData.created = new Date().toISOString();
                await addDoc(compoundsCollection, compoundData);
            }

            hideModal();
            loadCompounds();
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            errorEl.textContent = 'Ошибка при сохранении: ' + error.message;
        }
    };

    window.deleteCompound = async function(compoundId) {
        if (!confirm('Удалить эту смесь?')) return;

        try {
            const compoundRef = doc(db, 'compounds', compoundId);
            await deleteDoc(compoundRef);
            loadCompounds();
        } catch (error) {
            console.error('Ошибка удаления:', error);
            alert('Не удалось удалить данные');
        }
    };

    window.editCompound = function(compoundId) {
        showAddModal(compoundId);
    };

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showError(message) {
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 2rem; color: #e74c3c;">
                        ❌ ${message}
                    </td>
                </tr>
            `;
        }
    }

    function updateStats() {
        if (statsEl) {
            const filtered = filterCompounds(allCompounds, currentSearchTerm);
            statsEl.textContent = `Всего: ${filtered.length} из ${allCompounds.length}`;
        }
    }

    function subscribeToChanges() {
        const q = query(compoundsCollection, orderBy('name'));
        onSnapshot(q, (snapshot) => {
            console.log('🔄 Данные изменились, обновляем...');
            loadCompounds();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value;
            renderTable();
            updateStats();
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        loadCompounds();
        subscribeToChanges();
    });

    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
})();