/**
 * firebase-cloudinary-sync.js
 * - Substitua os placeholders abaixo:
 *    CLOUD_NAME -> sua Cloud name do Cloudinary
 *    UPLOAD_PRESET -> nome do upload preset (unsigned)
 *    firebaseConfig -> cole o objeto do seu Firebase
 *
 * Uso:
 * - Incluir os SDKs do Firebase (app, auth, firestore compat) antes deste script no index.html
 * - Colocar este arquivo na mesma pasta do index.html e incluir: <script src="firebase-cloudinary-sync.js"></script>
 */

(function () {
  if (typeof firebase === 'undefined') {
    console.error('Firebase SDK não encontrado. Inclua os scripts do Firebase antes deste arquivo.');
    return;
  }

  // ======= CONFIGURE AQUI =======
  const CLOUD_NAME = "dx4ghtdut";        // ex: 'minhaconta'
  const UPLOAD_PRESET = "loveu_unsigned";  // ex: 'album_unsigned'
  const firebaseConfig = {
    apiKey: "AIzaSyAsqb4bJaptuCqI5eroasO5f6i2BTm_TiY",
    authDomain: "loveu-6f63c.firebaseapp.com",
    projectId: "loveu-6f63c",
    storageBucket: "loveu-6f63c.firebasestorage.app",
    messagingSenderId: "615722418998",
    appId: "1:615722418998:web:04ae159bdf9bf8acdf6997"
  };
  // ===============================

  try { if (!firebase.apps.length) firebase.initializeApp(firebaseConfig); } catch (e) { console.error('Erro inicializando Firebase', e); return; }

  const auth = firebase.auth();
  const db = firebase.firestore();

  // Login anônimo automático
  auth.onAuthStateChanged(user => {
    if (!user) {
      auth.signInAnonymously().catch(err => console.error('auth error', err));
    } else {
      console.log('Firebase: autenticado anonimamente como', user.uid);
    }
  });

  // DOM elements do seu index.html
  const albumFiles = document.getElementById('albumFiles');
  const albumUploadBtn = document.getElementById('albumUploadBtn');
  const albumGrid = document.getElementById('albumGrid');

  if (!albumFiles || !albumUploadBtn || !albumGrid) {
    console.warn('Elementos do álbum não encontrados (albumFiles, albumUploadBtn, albumGrid). Verifique os IDs.');
  }

  // Função que envia um arquivo para Cloudinary via unsigned upload
  async function uploadToCloudinary(file) {
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', UPLOAD_PRESET);

    const resp = await fetch(url, { method: 'POST', body: fd });
    if (!resp.ok) throw new Error('Upload Cloudinary falhou: ' + resp.statusText);
    const json = await resp.json();
    // json.secure_url tem a URL pública da imagem
    return json;
  }

  // Faz upload para Cloudinary, depois registra a URL no Firestore
  async function uploadAndSave(file) {
    try {
      const uid = (auth.currentUser && auth.currentUser.uid) || 'anon';
      const cloudResp = await uploadToCloudinary(file);
      const imageUrl = cloudResp.secure_url || cloudResp.url;
      if (!imageUrl) throw new Error('Cloudinary não retornou URL');

      await db.collection('photos').add({
        url: imageUrl,
        name: file.name,
        uploader: uid,
        ts: firebase.firestore.FieldValue.serverTimestamp()
      });

      console.log('Enviado e salvo:', file.name);
      return true;
    } catch (err) {
      console.error('Erro uploadAndSave', err);
      throw err;
    }
  }

  // Botão Enviar
  if (albumUploadBtn) {
    albumUploadBtn.addEventListener('click', async () => {
      const files = albumFiles.files;
      if (!files || files.length === 0) {
        alert('Selecione pelo menos uma imagem para enviar.');
        return;
      }
      albumUploadBtn.disabled = true;
      albumUploadBtn.textContent = 'Enviando...';
      try {
        for (let i = 0; i < files.length; i++) {
          await uploadAndSave(files[i]);
        }
        albumFiles.value = '';
      } catch (e) {
        alert('Erro ao enviar. Veja console para detalhes.');
      } finally {
        albumUploadBtn.disabled = false;
        albumUploadBtn.textContent = '📤 Enviar';
      }
    });
  }

  // Renderiza um cartão da grid (usa openModal se existir no seu index.html)
  function renderItem(data) {
    const wrapper = document.createElement('div');
    wrapper.style = 'border-radius:8px;overflow:hidden;background:rgba(255,255,255,0.02);cursor:pointer';
    wrapper.innerHTML = `<img src="${data.url}" alt="${(data.name||'Foto')}" style="width:100%;height:120px;object-fit:cover;display:block">`;
    const img = wrapper.querySelector('img');
    img.addEventListener('click', () => {
      if (typeof openModal === 'function') openModal(data.url, data.name || '');
      else window.open(data.url, '_blank');
    });
    return wrapper;
  }

  // Escuta mudanças em tempo real na coleção 'photos'
  db.collection('photos').orderBy('ts', 'asc').onSnapshot(snapshot => {
    if (!albumGrid) return;
    albumGrid.innerHTML = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const el = renderItem(data);
      albumGrid.appendChild(el);
    });
  }, err => {
    console.error('Erro ao escutar photos', err);
  });

})();