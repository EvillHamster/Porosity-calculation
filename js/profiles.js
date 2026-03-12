// ============================================
// js/profiles.js - УПРАВЛЕНИЕ ПЛАНКАМИ (FIREBASE)
// ============================================

import { 
    profilesCollection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    onSnapshot,
    db 
} from './firebase.js';

(function() {
    const tableBody = document.getElementById('tableBody');
    const searchInput = document.getElementById('searchInput');
    const statsEl = document.getElementById('stats');
    const modal = document.getElementById('modal');
    
    let allProfiles = [];
    let currentSearchTerm = '';

    // ===== ЗАГРУЗКА ДАННЫХ ИЗ FIREBASE =====
    async function loadProfiles() {
        try {
            const q = query(profilesCollection, orderBy('name'));
            const querySnapshot = await getDocs(q);
            
            allProfiles = querySnapshot.docs.map(doc => ({
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

    // ===== СОХРАНЕНИЕ В FIREBASE =====
    async function saveProfilesToFirebase() {
        // Эта функция больше не нужна, так как мы работаем напрямую
        // Но оставим для совместимости
    }

    // ===== ОТОБРАЖЕНИЕ ТАБЛИЦЫ =====
    function renderTable() {
        if (!tableBody) return;
        
        const filtered = filterProfiles(allProfiles, currentSearchTerm);

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem; color: #7f8c8d;">
                        ${allProfiles.length === 0 ? '📭 Нет сохраненных планок. Нажмите "Новая планка" для добавления.' : '🔍 Ничего не найдено'}
                    </td>
                </tr>
            `;
        } else {
            tableBody.innerHTML = filtered.map(profile => `
                <tr>
                    <td><strong>${escapeHtml(profile.name)}</strong></td>
                    <td><span style="background: #e8f5e9; padding: 0.3rem 0.8rem; border-radius: 12px;">${profile.sSpec?.toFixed(2)}</span></td>
                    <td><span style="background: #e8f5e9; padding: 0.3rem 0.8rem; border-radius: 12px;">${profile.sCap?.toFixed(2)}</span></td>
                    <td><span style="background: #e8f5e9; padding: 0.3rem 0.8rem; border-radius: 12px;">${profile.wCap?.toFixed(3)}</span></td>
                    <td><span style="background: #e8f5e9; padding: 0.3rem 0.8rem; border-radius: 12px;">${profile.wSpec?.toFixed(3)}</span></td>
                    <td>
                        <button onclick="editProfile('${profile.id}')" style="background: #f39c12; color: white; border: none; padding: 0.3rem 0.8rem; border-radius: 4px; cursor: pointer; margin-right: 0.3rem;">✏️</button>
                        <button onclick="deleteProfile('${profile.id}')" style="background: #e74c3c; color: white; border: none; padding: 0.3rem 0.8rem; border-radius: 4px; cursor: pointer;">🗑️</button>
                    </td>
                </tr>
            `).join('');
        }
    }

    // ===== ФИЛЬТРАЦИЯ =====
    function filterProfiles(profiles, searchTerm) {
        if (!searchTerm) return profiles;
        const term = searchTerm.toLowerCase();
        return profiles.filter(p => 
            p.name.toLowerCase().includes(term)
        );
    }

    // ===== ДОБАВЛЕНИЕ/РЕДАКТИРОВАНИЕ =====
    window.showAddModal = function(profileId = null) {
        const title = document.getElementById('modalTitle');
        
        document.getElementById('modalName').value = '';
        document.getElementById('modalSSpec').value = '';
        document.getElementById('modalSCap').value = '';
        document.getElementById('modalWCap').value = '';
        document.getElementById('modalWSpec').value = '';
        document.getElementById('modalError').textContent = '';
        
        if (profileId) {
            const profile = allProfiles.find(p => p.id === profileId);
            if (profile) {
                title.textContent = 'Редактировать планку';
                document.getElementById('modalName').value = profile.name || '';
                document.getElementById('modalSSpec').value = profile.sSpec || '';
                document.getElementById('modalSCap').value = profile.sCap || '';
                document.getElementById('modalWCap').value = profile.wCap || '';
                document.getElementById('modalWSpec').value = profile.wSpec || '';
                modal.dataset.editId = profileId;
            }
        } else {
            title.textContent = 'Добавить планку';
            delete modal.dataset.editId;
        }
        
        modal.style.display = 'flex';
    };

    window.hideModal = function() {
        modal.style.display = 'none';
    };

    window.saveProfile = async function() {
        const name = document.getElementById('modalName').value.trim();
        const sSpec = parseFloat(document.getElementById('modalSSpec').value);
        const sCap = parseFloat(document.getElementById('modalSCap').value);
        const wCap = parseFloat(document.getElementById('modalWCap').value);
        const wSpec = parseFloat(document.getElementById('modalWSpec').value);
        const errorEl = document.getElementById('modalError');
        const editId = modal.dataset.editId;

        if (!name) {
            errorEl.textContent = 'Введите название планки';
            return;
        }
        if (isNaN(sSpec) || sSpec <= 0) {
            errorEl.textContent = 'Введите корректную S spec';
            return;
        }
        if (isNaN(sCap) || sCap <= 0) {
            errorEl.textContent = 'Введите корректную S cap';
            return;
        }
        if (isNaN(wCap) || wCap <= 0) {
            errorEl.textContent = 'Введите корректную W cap';
            return;
        }
        if (isNaN(wSpec) || wSpec <= 0) {
            errorEl.textContent = 'Введите корректную W spec';
            return;
        }

        try {
            const profileData = {
                name: name,
                sSpec: sSpec,
                sCap: sCap,
                wCap: wCap,
                wSpec: wSpec,
                lastModified: new Date().toISOString()
            };

            if (editId) {
                const profileRef = doc(db, 'profiles', editId);
                await updateDoc(profileRef, profileData);
            } else {
                profileData.created = new Date().toISOString();
                await addDoc(profilesCollection, profileData);
            }

            hideModal();
            loadProfiles();
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            errorEl.textContent = 'Ошибка при сохранении: ' + error.message;
        }
    };

    window.deleteProfile = async function(profileId) {
        if (!confirm('Удалить эту планку?')) return;

        try {
            const profileRef = doc(db, 'profiles', profileId);
            await deleteDoc(profileRef);
            loadProfiles();
        } catch (error) {
            console.error('Ошибка удаления:', error);
            alert('Не удалось удалить данные');
        }
    };

    window.editProfile = function(profileId) {
        showAddModal(profileId);
    };

    window.duplicateProfile = async function(profileId) {
        const profile = allProfiles.find(p => p.id === profileId);
        if (profile) {
            try {
                const newProfile = {
                    name: profile.name + ' (копия)',
                    sSpec: profile.sSpec,
                    sCap: profile.sCap,
                    wCap: profile.wCap,
                    wSpec: profile.wSpec,
                    created: new Date().toISOString(),
                    lastModified: new Date().toISOString()
                };
                await addDoc(profilesCollection, newProfile);
                loadProfiles();
            } catch (error) {
                console.error('Ошибка копирования:', error);
                alert('Не удалось скопировать');
            }
        }
    };

    // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showError(message) {
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem; color: #e74c3c;">
                        ❌ ${message}
                    </td>
                </tr>
            `;
        }
    }

    function updateStats() {
        if (statsEl) {
            const filtered = filterProfiles(allProfiles, currentSearchTerm);
            statsEl.textContent = `Всего: ${filtered.length} из ${allProfiles.length}`;
        }
    }

    // ===== СЛУШАЕМ ИЗМЕНЕНИЯ В РЕАЛЬНОМ ВРЕМЕНИ =====
    function subscribeToChanges() {
        const q = query(profilesCollection, orderBy('name'));
        onSnapshot(q, (snapshot) => {
            console.log('🔄 Данные изменились, обновляем...');
            loadProfiles();
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
        loadProfiles();
        subscribeToChanges();
    });

    // Закрытие модального окна
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
})();