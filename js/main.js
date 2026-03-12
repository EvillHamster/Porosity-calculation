import { db, compoundsCollection, profilesCollection, getDocs, query, orderBy, collection, addDoc } from './firebase.js';

(function() {
  // Существующие элементы
  const actW = document.getElementById('actual__weight');
  const actL = document.getElementById('actual__length');
  const w1m = document.getElementById('w__actual--one-metr');
  const sSpec = document.getElementById('spec__area');
  const sAct = document.getElementById('actual__area');
  const w2m = document.getElementById('w__actual--aproved-spec');
  const wSpec = document.getElementById('w__specification');
  const deltaField = document.getElementById('w__delta');
  const sCap = document.getElementById('s__cap');
  const wCap = document.getElementById('w__cap');
  const denExtr = document.getElementById('den__extr');
  const denCompound = document.getElementById('den__compound');
  const kPorosity = document.getElementById('k__porosity');
  const saveMeasurementBtn = document.getElementById('saveMeasurementBtn');
  
  // Элементы для поиска и карточек
  const compoundSearch = document.getElementById('compoundSearch');
  const compoundDropdown = document.getElementById('compoundDropdown');
  const profileSearch = document.getElementById('profileSearch');
  const profileDropdown = document.getElementById('profileDropdown');
  
  const selectedCompoundCard = document.getElementById('selectedCompoundCard');
  const selectedCompoundName = document.getElementById('selectedCompoundName');
  const selectedCompoundDensity = document.getElementById('selectedCompoundDensity');
  
  const selectedProfileCard = document.getElementById('selectedProfileCard');
  const selectedProfileName = document.getElementById('selectedProfileName');
  const selectedProfileSSpec = document.getElementById('selectedProfileSSpec');
  const selectedProfileSCap = document.getElementById('selectedProfileSCap');
  const selectedProfileWCap = document.getElementById('selectedProfileWCap');
  const selectedProfileWSpec = document.getElementById('selectedProfileWSpec');

  // Ключи хранилища
  const SELECTED_COMPOUND_KEY = 'selected_compound_id';
  const SELECTED_PROFILE_KEY = 'selected_profile_id';

  // Текущие выбранные элементы
  let selectedCompound = null;
  let selectedProfile = null;
  
  // Все данные из Firebase
  let allCompounds = [];
  let allProfiles = [];

  // ========== ЗАГРУЗКА ДАННЫХ ИЗ FIREBASE ==========
  
  async function loadCompoundsFromFirebase() {
    try {
      const q = query(compoundsCollection, orderBy('name'));
      const querySnapshot = await getDocs(q);
      allCompounds = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      renderCompoundDropdown();
      return allCompounds;
    } catch (error) {
      console.error('Ошибка загрузки смесей:', error);
      return [];
    }
  }

  async function loadProfilesFromFirebase() {
    try {
      const q = query(profilesCollection, orderBy('name'));
      const querySnapshot = await getDocs(q);
      allProfiles = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      renderProfileDropdown();
      return allProfiles;
    } catch (error) {
      console.error('Ошибка загрузки планок:', error);
      return [];
    }
  }

  // ========== ФУНКЦИИ СОХРАНЕНИЯ ВЫБРАННОГО ==========
  
  function saveSelectedCompound(compoundId) {
    if (compoundId) {
      localStorage.setItem(SELECTED_COMPOUND_KEY, compoundId);
    } else {
      localStorage.removeItem(SELECTED_COMPOUND_KEY);
    }
  }

  function saveSelectedProfile(profileId) {
    if (profileId) {
      localStorage.setItem(SELECTED_PROFILE_KEY, profileId);
    } else {
      localStorage.removeItem(SELECTED_PROFILE_KEY);
    }
  }

  function loadSelectedCompound() {
    return localStorage.getItem(SELECTED_COMPOUND_KEY);
  }

  function loadSelectedProfile() {
    return localStorage.getItem(SELECTED_PROFILE_KEY);
  }

  // ========== ФУНКЦИИ ДЛЯ ПОИСКА ==========
  
  function filterCompounds(searchTerm) {
    if (!searchTerm) return allCompounds;
    const term = searchTerm.toLowerCase();
    return allCompounds.filter(c => 
      c.name.toLowerCase().includes(term) || 
      c.density?.toString().includes(term)
    );
  }

  function filterProfiles(searchTerm) {
    if (!searchTerm) return allProfiles;
    const term = searchTerm.toLowerCase();
    return allProfiles.filter(p => 
      p.name.toLowerCase().includes(term)
    );
  }

  function renderCompoundDropdown(searchTerm = '') {
    if (!compoundDropdown) return;
    
    const filtered = filterCompounds(searchTerm);
    
    if (filtered.length === 0) {
      compoundDropdown.innerHTML = '<div class="no-results">Ничего не найдено</div>';
      return;
    }
    
    compoundDropdown.innerHTML = filtered.map(compound => `
      <div class="dropdown-item ${selectedCompound?.id === compound.id ? 'selected' : ''}" 
           data-compound-id="${compound.id}"
           onclick="selectCompoundFromDropdown('${compound.id}')">
        <div style="font-weight: 500;">${compound.name}</div>
        <div style="font-size: 0.85rem; color: #27ae60;">ρ = ${compound.density?.toFixed(4)} г/мм²</div>
      </div>
    `).join('');
  }

  function renderProfileDropdown(searchTerm = '') {
    if (!profileDropdown) return;
    
    const filtered = filterProfiles(searchTerm);
    
    if (filtered.length === 0) {
      profileDropdown.innerHTML = '<div class="no-results">Ничего не найдено</div>';
      return;
    }
    
    profileDropdown.innerHTML = filtered.map(profile => `
      <div class="dropdown-item ${selectedProfile?.id === profile.id ? 'selected' : ''}" 
           data-profile-id="${profile.id}"
           onclick="selectProfileFromDropdown('${profile.id}')">
        <div style="font-weight: 500;">${profile.name}</div>
        <div style="font-size: 0.85rem; color: #3498db;">S spec: ${profile.sSpec?.toFixed(2)} | S cap: ${profile.sCap?.toFixed(2)}</div>
      </div>
    `).join('');
  }

  // Глобальные функции для выбора из дропдауна
  window.selectCompoundFromDropdown = function(compoundId) {
    const compound = allCompounds.find(c => c.id === compoundId);
    if (compound) {
      selectCompound(compound);
      if (compoundSearch) compoundSearch.value = compound.name;
      hideCompoundDropdown();
    }
  };

  window.selectProfileFromDropdown = function(profileId) {
    const profile = allProfiles.find(p => p.id === profileId);
    if (profile) {
      selectProfile(profile);
      if (profileSearch) profileSearch.value = profile.name;
      hideProfileDropdown();
    }
  };

  function selectCompound(compound) {
    selectedCompound = compound;
    
    if (selectedCompoundCard && selectedCompoundName && selectedCompoundDensity) {
      selectedCompoundCard.style.display = 'block';
      selectedCompoundName.textContent = compound.name;
      selectedCompoundDensity.textContent = compound.density?.toFixed(4) || '';
    }
    
    if (denCompound) denCompound.value = compound.density || '';
    
    saveSelectedCompound(compound.id);
    renderCompoundDropdown(compoundSearch?.value);
    saveCurrentToLocalStorage();
    calcFinal();
  }

  function selectProfile(profile) {
    selectedProfile = profile;
    
    if (selectedProfileCard && selectedProfileName && 
        selectedProfileSSpec && selectedProfileSCap && 
        selectedProfileWCap && selectedProfileWSpec) {
      selectedProfileCard.style.display = 'block';
      selectedProfileName.textContent = profile.name;
      selectedProfileSSpec.textContent = profile.sSpec?.toFixed(2) || '';
      selectedProfileSCap.textContent = profile.sCap?.toFixed(2) || '';
      selectedProfileWCap.textContent = profile.wCap?.toFixed(3) || '';
      selectedProfileWSpec.textContent = profile.wSpec?.toFixed(3) || '';
    }
    
    if (sSpec) sSpec.value = profile.sSpec || '';
    if (sCap) sCap.value = profile.sCap || '';
    if (wCap) wCap.value = profile.wCap || '';
    if (wSpec) wSpec.value = profile.wSpec || '';
    
    saveSelectedProfile(profile.id);
    renderProfileDropdown(profileSearch?.value);
    saveCurrentToLocalStorage();
    calcW1();
  }

  function clearSelectedCompound() {
    selectedCompound = null;
    if (selectedCompoundCard) selectedCompoundCard.style.display = 'none';
    if (denCompound) denCompound.value = '';
    if (compoundSearch) compoundSearch.value = '';
    saveSelectedCompound(null);
    renderCompoundDropdown();
    saveCurrentToLocalStorage();
  }

  function clearSelectedProfile() {
    selectedProfile = null;
    if (selectedProfileCard) selectedProfileCard.style.display = 'none';
    if (sSpec) sSpec.value = '';
    if (sCap) sCap.value = '';
    if (wCap) wCap.value = '';
    if (wSpec) wSpec.value = '';
    if (profileSearch) profileSearch.value = '';
    saveSelectedProfile(null);
    renderProfileDropdown();
    saveCurrentToLocalStorage();
  }

  // ========== УПРАВЛЕНИЕ ДРОПДАУНАМИ ==========
  
  function showCompoundDropdown() {
    if (compoundDropdown) {
      compoundDropdown.classList.add('show');
      renderCompoundDropdown(compoundSearch?.value);
    }
  }

  function hideCompoundDropdown() {
    if (compoundDropdown) {
      compoundDropdown.classList.remove('show');
    }
  }

  function showProfileDropdown() {
    if (profileDropdown) {
      profileDropdown.classList.add('show');
      renderProfileDropdown(profileSearch?.value);
    }
  }

  function hideProfileDropdown() {
    if (profileDropdown) {
      profileDropdown.classList.remove('show');
    }
  }

  // ========== СОХРАНЕНИЕ В ЛОКАЛКУ ДЛЯ ИСТОРИИ ==========
  
  function saveCurrentToLocalStorage() {
    localStorage.setItem('current_w_act', actW?.value || '');
    localStorage.setItem('current_l_act', actL?.value || '');
    localStorage.setItem('current_s_act', sAct?.value || '');
    localStorage.setItem('current_kp', kPorosity?.value || '');
    localStorage.setItem('current_w2_act', w2m?.value || '');
    localStorage.setItem('current_compound_name', selectedCompound?.name || 'Не выбрана');
    localStorage.setItem('current_profile_name', selectedProfile?.name || 'Не выбрана');
  }

  // ========== СОХРАНЕНИЕ ЗАМЕРА ==========
  
  if (saveMeasurementBtn) {
    saveMeasurementBtn.addEventListener('click', async () => {
      try {
        if (!actW?.value || !actL?.value || !sAct?.value) {
          alert('❌ Заполните W act, l act и S act');
          return;
        }

        const measurementData = {
          wAct: parseFloat(actW.value) || 0,
          lAct: parseFloat(actL.value) || 0,
          sAct: parseFloat(sAct.value) || 0,
          kp: parseFloat(kPorosity?.value) || 0,
          w2Act: parseFloat(w2m?.value) || 0,
          compoundName: selectedCompound?.name || 'Не выбрана',
          profileName: selectedProfile?.name || 'Не выбрана',
          date: new Date().toISOString(),
          lastModified: new Date().toISOString()
        };

        const measurementsCollection = collection(db, 'measurements');
        await addDoc(measurementsCollection, measurementData);
        
        alert('✅ Замер сохранен в историю!');
      } catch (error) {
        console.error('Ошибка сохранения:', error);
        alert('❌ Ошибка при сохранении замера: ' + error.message);
      }
    });
  }

  // ========== ИНИЦИАЛИЗАЦИЯ ВЫБРАННЫХ ==========
  
  async function loadSelectedFromStorage() {
    await loadCompoundsFromFirebase();
    await loadProfilesFromFirebase();
    
    const selectedCompoundId = loadSelectedCompound();
    const selectedProfileId = loadSelectedProfile();
    
    if (selectedCompoundId) {
      const compound = allCompounds.find(c => c.id === selectedCompoundId);
      if (compound) {
        selectCompound(compound);
        if (compoundSearch) compoundSearch.value = compound.name;
      }
    }
    
    if (selectedProfileId) {
      const profile = allProfiles.find(p => p.id === selectedProfileId);
      if (profile) {
        selectProfile(profile);
        if (profileSearch) profileSearch.value = profile.name;
      }
    }
  }

  // ========== ОБРАБОТЧИКИ СОБЫТИЙ ==========
  
  if (compoundSearch) {
    compoundSearch.addEventListener('focus', showCompoundDropdown);
    compoundSearch.addEventListener('input', function(e) {
      renderCompoundDropdown(e.target.value);
      showCompoundDropdown();
    });
    
    compoundSearch.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        hideCompoundDropdown();
      } else if (e.key === 'Enter') {
        const firstItem = compoundDropdown?.querySelector('.dropdown-item');
        if (firstItem) {
          firstItem.click();
        }
      }
    });
  }

  if (profileSearch) {
    profileSearch.addEventListener('focus', showProfileDropdown);
    profileSearch.addEventListener('input', function(e) {
      renderProfileDropdown(e.target.value);
      showProfileDropdown();
    });
    
    profileSearch.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        hideProfileDropdown();
      } else if (e.key === 'Enter') {
        const firstItem = profileDropdown?.querySelector('.dropdown-item');
        if (firstItem) {
          firstItem.click();
        }
      }
    });
  }

  document.addEventListener('click', function(e) {
    if (compoundSearch && !compoundSearch.contains(e.target) && 
        compoundDropdown && !compoundDropdown.contains(e.target)) {
      hideCompoundDropdown();
    }
    
    if (profileSearch && !profileSearch.contains(e.target) && 
        profileDropdown && !profileDropdown.contains(e.target)) {
      hideProfileDropdown();
    }
  });

  // ========== ФУНКЦИИ РАСЧЕТА ==========
  
  function setValue(el, val) {
    if (el) el.value = (val !== undefined && !isNaN(val)) ? Number(val).toFixed(4) : '';
  }

  function calcW1() {
    let w = parseFloat(actW?.value);
    let l = parseFloat(actL?.value);
    if (!isNaN(w) && !isNaN(l) && l > 0) {
      let res = (w * 1000 / l);
      setValue(w1m, res);
    } else { 
      if (w1m) w1m.value = ''; 
    }
    calcW2();
    calcDeltaAndExtr();
    saveCurrentToLocalStorage();
  }

  function calcW2() {
    let w1 = parseFloat(w1m?.value);
    let ssp = parseFloat(sSpec?.value);
    let sac = parseFloat(sAct?.value);
    if (!isNaN(w1) && !isNaN(ssp) && !isNaN(sac) && sac > 0) {
      let res = (w1 * ssp / sac);
      setValue(w2m, res);
    } else { 
      if (w2m) w2m.value = ''; 
    }
    calcDeltaAndExtr();
    saveCurrentToLocalStorage();
  }

  function calcDeltaAndExtr() {
    let w2 = parseFloat(w2m?.value);
    let wS = parseFloat(wSpec?.value);
    if (!isNaN(w2) && !isNaN(wS)) {
      let delta = w2 - wS;
      setValue(deltaField, delta);
    } else { 
      if (deltaField) deltaField.value = ''; 
    }
  }

  function calcFinal() {
    let w2 = parseFloat(w2m?.value);
    let wS = parseFloat(wSpec?.value);
    let delta = (!isNaN(w2) && !isNaN(wS)) ? w2 - wS : NaN;
    setValue(deltaField, delta);

    let wCapVal = parseFloat(wCap?.value);
    let sC = parseFloat(sCap?.value);
    if (!isNaN(delta) && !isNaN(sC) && sC > 0) {
      let wCapForCalc = !isNaN(wCapVal) ? wCapVal : 0;
      let rhoExtr = (wCapForCalc + delta) / sC;
      setValue(denExtr, rhoExtr);
    } else { 
      if (denExtr) denExtr.value = ''; 
    }

    let rhoMix = parseFloat(denCompound?.value);
    let rhoE = parseFloat(denExtr?.value);
    if (!isNaN(rhoE) && !isNaN(rhoMix) && rhoMix !== 0) {
      let k = rhoE / rhoMix;
      setValue(kPorosity, k);
    } else { 
      if (kPorosity) kPorosity.value = ''; 
    }
    
    saveCurrentToLocalStorage();
  }

  // ========== ОЧИСТКА ==========
  
  window.clearStoredData = function() {
    localStorage.removeItem(SELECTED_COMPOUND_KEY);
    localStorage.removeItem(SELECTED_PROFILE_KEY);
    console.log('Выбор очищен');
    location.reload();
  };

  // ========== ИНИЦИАЛИЗАЦИЯ ==========
  
  loadSelectedFromStorage();
  
  if (actW && actL) {
    actW.addEventListener('input', () => { calcW1(); calcFinal(); });
    actL.addEventListener('input', () => { calcW1(); calcFinal(); });
  }
  
  if (sSpec && sAct) {
    sSpec.addEventListener('input', () => { calcW2(); calcFinal(); });
    sAct.addEventListener('input', () => { calcW2(); calcFinal(); });
  }
  
  if (wSpec) wSpec.addEventListener('input', calcFinal);
  if (sCap) sCap.addEventListener('input', calcFinal);
  if (wCap) wCap.addEventListener('input', calcFinal);
  if (denCompound) denCompound.addEventListener('input', calcFinal);

  if (selectedCompoundCard) {
    const clearBtn = document.createElement('button');
    clearBtn.textContent = '×';
    clearBtn.style.cssText = 'background: none; border: none; color: #e74c3c; font-size: 1.5rem; cursor: pointer; margin-left: 0.5rem;';
    clearBtn.title = 'Очистить выбор';
    clearBtn.onclick = clearSelectedCompound;
    selectedCompoundCard.querySelector('.badge-green')?.after(clearBtn);
  }

  if (selectedProfileCard) {
    const clearBtn = document.createElement('button');
    clearBtn.textContent = '×';
    clearBtn.style.cssText = 'background: none; border: none; color: #e74c3c; font-size: 1.5rem; cursor: pointer; margin-left: 0.5rem;';
    clearBtn.title = 'Очистить выбор';
    clearBtn.onclick = clearSelectedProfile;
    selectedProfileCard.querySelector('.badge-blue')?.after(clearBtn);
  }

  calcW1();
  console.log('main.js с Firebase загружен');
})();