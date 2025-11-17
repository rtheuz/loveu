/* Álbum persistente usando IndexedDB
   - Crie um arquivo público (ex: public/album.js) e inclua no index.html após o restante dos scripts:
     <script src="public/album.js"></script>
   - Este script usa o modal existente (#modal, #modalImg) se presente para visualização ampliada.
*/

(function () {
  // utilidades IndexedDB simples
  const DB_NAME = 'loveu-album';
  const DB_VERSION = 1;
  const STORE_NAME = 'photos';

  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (ev) => {
        const db = ev.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function withStore(mode, fn) {
    return openDb().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      try {
        const r = fn(store);
        tx.oncomplete = () => resolve(r);
        tx.onerror = () => reject(tx.error);
      } catch (e) { reject(e); }
    }));
  }

  function addPhotoObject(obj) {
    return withStore('readwrite', store => store.add(obj));
  }

  function getAllPhotos() {
    return openDb().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    }));
  }

  function deletePhoto(id) {
    return withStore('readwrite', store => store.delete(id));
  }

  // Converte DataURL para Blob
  function dataURLToBlob(dataURL) {
    const parts = dataURL.split(',');
    const meta = parts[0].match(/:(.*?);/);
    const mime = meta ? meta[1] : 'image/png';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8 = new Uint8Array(n);
    while (n--) u8[n] = bstr.charCodeAt(n);
    return new Blob([u8], { type: mime });
  }

  // Lê um Blob retornando uma dataURL (usado em export)
  function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(blob);
    });
  }

  // Renderiza o grid
  function renderGrid() {
    const grid = document.getElementById('albumGrid');
    if (!grid) return;
    grid.innerHTML = '';
    getAllPhotos().then(items => {
      // ordenar por createdAt desc
      items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.padding = '0';
        card.style.position = 'relative';
        card.style.overflow = 'hidden';
        card.style.borderRadius = '10px';
        card.style.cursor = 'pointer';

        const img = document.createElement('img');
        // se objeto tem blob armazenado, criar URL
        if (item.blob) {
          try {
            const u = URL.createObjectURL(item.blob);
            img.src = u;
            img.onload = () => { URL.revokeObjectURL(u); };
          } catch (e) {
            // se por algum motivo o blob não for utilizável, tente dataURL
            img.src = item.dataURL || '';
          }
        } else if (item.dataURL) {
          img.src = item.dataURL;
        } else {
          img.src = '';
        }
        img.alt = item.name || 'Foto';
        img.style.width = '100%';
        img.style.height = '120px';
        img.style.objectFit = 'cover';
        img.loading = 'lazy';
        card.appendChild(img);

        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.style.display = 'flex';
        meta.style.justifyContent = 'space-between';
        meta.style.alignItems = 'center';
        meta.style.gap = '6px';
        meta.style.padding = '6px 8px';
        meta.innerHTML = `<div style="font-size:.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.name || 'Sem nome'}</div>`;

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '6px';

        const openBtn = document.createElement('button');
        openBtn.className = 'small btn';
        openBtn.textContent = '🔍';
        openBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          openLightbox(item);
        });

        const delBtn = document.createElement('button');
        delBtn.className = 'small btn';
        delBtn.style.background = 'linear-gradient(135deg,#ff7676,#ffb199)';
        delBtn.textContent = '🗑️';
        delBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          if (confirm('Remover esta foto?')) {
            deletePhoto(item.id).then(() => { renderGrid(); addAchievementIfExists(); }).catch(console.error);
          }
        });

        actions.appendChild(openBtn);
        actions.appendChild(delBtn);
        meta.appendChild(actions);

        card.appendChild(meta);

        card.addEventListener('click', () => openLightbox(item));
        grid.appendChild(card);
      });
    }).catch(err => { console.error('renderGrid err', err); });
  }

  // Abre imagem em modal existente (#modal, #modalImg). Se não existir, abre em nova janela.
  function openLightbox(item) {
    const modal = document.getElementById('modal');
    const modalImg = document.getElementById('modalImg');
    if (modal && modalImg) {
      if (item.blob) {
        const u = URL.createObjectURL(item.blob);
        modalImg.src = u;
        modalImg.onload = () => URL.revokeObjectURL(u);
      } else if (item.dataURL) {
        modalImg.src = item.dataURL;
      } else {
        modalImg.src = '';
      }
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      // fechar ao clicar no fundo (se a lógica modal do index.html não existir, adicionamos)
      modal.addEventListener('click', function onClick(e) {
        if (e.target === modal) {
          modal.classList.remove('open');
          modalImg.src = '';
          modal.setAttribute('aria-hidden', 'true');
          modal.removeEventListener('click', onClick);
        }
      });
      // também fecha com ESC
      const esc = (ev) => { if (ev.key === 'Escape') { modal.classList.remove('open'); modalImg.src = ''; modal.setAttribute('aria-hidden', 'true'); document.removeEventListener('keydown', esc); } };
      document.addEventListener('keydown', esc);
      return;
    }
    // fallback: abrir em nova aba
    if (item.blob) {
      const u = URL.createObjectURL(item.blob);
      window.open(u, '_blank');
      setTimeout(() => URL.revokeObjectURL(u), 5000);
    } else if (item.dataURL) {
      window.open(item.dataURL, '_blank');
    }
  }

  // Uploads: lê arquivos e adiciona ao DB
  function handleFiles(files) {
    const arr = Array.from(files).filter(f => f && f.type && f.type.startsWith('image/'));
    if (arr.length === 0) return Promise.resolve();
    const readers = arr.map(f => new Promise((resolve) => {
      // armazenamos o blob e também um dataURL (opcional) para exportar/compatibilidade
      const obj = { name: f.name, createdAt: Date.now() };
      // preferimos armazenar o Blob para economizar espaço; em alguns navegadores blobs em IDB funcionam bem
      obj.blob = f;
      // também geramos uma dataURL para export
      const fr = new FileReader();
      fr.onload = () => { obj.dataURL = fr.result; addPhotoObject(obj).then(() => resolve()); };
      fr.onerror = () => { addPhotoObject(obj).then(() => resolve()); };
      fr.readAsDataURL(f);
    }));
    return Promise.all(readers).then(() => renderGrid());
  }

  // Export album: transforma cada item em {name, dataURL, createdAt} e baixa JSON
  function exportAlbum() {
    getAllPhotos().then(items => {
      const toRead = items.map(it => {
        if (it.dataURL) return Promise.resolve({ name: it.name, dataURL: it.dataURL, createdAt: it.createdAt });
        if (it.blob) return blobToDataURL(it.blob).then(d => ({ name: it.name, dataURL: d, createdAt: it.createdAt }));
        return Promise.resolve({ name: it.name, dataURL: it.dataURL || null, createdAt: it.createdAt });
      });
      Promise.all(toRead).then(pairs => {
        const blob = new Blob([JSON.stringify({ exportedAt: Date.now(), items: pairs })], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'loveu-album-export.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      });
    }).catch(err => console.error('exportAlbum err', err));
  }

  // Import album from JSON file
  function importAlbumFile(file) {
    if (!file) return;
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const json = JSON.parse(fr.result);
        if (!json.items || !Array.isArray(json.items)) {
          alert('Arquivo inválido.');
          return;
        }
        const prom = json.items.map(it => {
          // it.dataURL -> blob
          const blob = it.dataURL ? dataURLToBlob(it.dataURL) : null;
          const obj = { name: it.name || 'imported', createdAt: it.createdAt || Date.now(), blob: blob, dataURL: it.dataURL || null };
          return addPhotoObject(obj);
        });
        Promise.all(prom).then(() => { renderGrid(); alert('Importação concluída.'); }).catch(e => { console.error(e); alert('Erro na importação.'); });
      } catch (e) {
        console.error('import parse err', e); alert('Erro ao ler o arquivo.');
      }
    };
    fr.onerror = () => { alert('Erro ao ler o arquivo de importação.'); };
    fr.readAsText(file);
  }

  // Ligação dos botões / inputs
  function initControls() {
    const fileInput = document.getElementById('albumFiles');
    const uploadBtn = document.getElementById('albumUploadBtn');
    const exportBtn = document.getElementById('albumExportBtn');
    const importBtn = document.getElementById('albumImportBtn');
    const importFile = document.getElementById('albumImportFile');

    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener('click', () => {
        if (fileInput.files && fileInput.files.length) handleFiles(fileInput.files);
      });
      // suporte arrastar/soltar na área do grid
      const grid = document.getElementById('albumGrid');
      const albumPanel = document.getElementById('albumPanel');
      const dropTarget = albumPanel || grid;
      if (dropTarget) {
        dropTarget.addEventListener('dragover', (e) => { e.preventDefault(); dropTarget.style.opacity = '0.85'; });
        dropTarget.addEventListener('dragleave', () => { dropTarget.style.opacity = ''; });
        dropTarget.addEventListener('drop', (e) => {
          e.preventDefault(); dropTarget.style.opacity = '';
          const files = Array.from(e.dataTransfer.files || []).filter(f => f.type && f.type.startsWith('image/'));
          if (files.length) handleFiles(files);
        });
      }
    }

    if (exportBtn) exportBtn.addEventListener('click', exportAlbum);
    if (importBtn && importFile) {
      importBtn.addEventListener('click', () => importFile.click());
      importFile.addEventListener('change', (ev) => {
        if (ev.target.files && ev.target.files[0]) importAlbumFile(ev.target.files[0]);
        ev.target.value = '';
      });
    }
  }

  // Small helper to award an achievement if album has items (integrado com seu addAchievement existente, se presente)
  function addAchievementIfExists() {
    getAllPhotos().then(items => {
      if (items && items.length > 0) {
        if (typeof window.addAchievement === 'function') {
          window.addAchievement('Criador(a) de Memórias');
        } else {
          try {
            const key = 'ALBUM_ACHIEVEMENT';
            if (!localStorage.getItem(key)) localStorage.setItem(key, '1');
          } catch (e) { }
        }
      }
    }).catch(console.error);
  }

  // Inicia
  function init() {
    openDb().then(() => {
      renderGrid();
      initControls();
      addAchievementIfExists();
      if (typeof window.addCursorHoverListeners === 'function') window.addCursorHoverListeners();
    }).catch(err => console.error('init album err', err));
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') init();
  else document.addEventListener('DOMContentLoaded', init);
})();