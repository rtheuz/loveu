(function () {
  if (typeof firebase === 'undefined') {
    console.error('Firebase SDK não encontrado. Inclua os scripts do Firebase antes deste arquivo.');
    return;
  }

  // ======= CONFIGURE AQUI =======
  const CLOUD_NAME = "dx4ghtdut";
  const UPLOAD_PRESET = "LOVEUBRUNA";
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

  // DOM elements
  const albumFiles = document.getElementById('albumFiles');
  const albumUploadBtn = document.getElementById('albumUploadBtn');
  const albumGrid = document.getElementById('albumGrid');

  if (!albumFiles || !albumUploadBtn || !albumGrid) {
    console.warn('Elementos do álbum não encontrados.');
  }

  // Upload sem delete_token
  async function uploadToCloudinary(file) {
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', UPLOAD_PRESET);

    const resp = await fetch(url, { method: 'POST', body: fd });
    if (!resp.ok) throw new Error('Upload Cloudinary falhou: ' + resp.status + ' ' + resp.statusText);
    return await resp.json();
  }

  // Upload e salvar no Firestore (sem delete_token)
  async function uploadAndSave(file) {
    try {
      const uid = (auth.currentUser && auth.currentUser.uid) || 'anon';
      const cloudResp = await uploadToCloudinary(file);
      const imageUrl = cloudResp.secure_url || cloudResp.url;
      const public_id = cloudResp.public_id || null;

      if (!imageUrl) throw new Error('Cloudinary não retornou URL');

      await db.collection('photos').add({
        url: imageUrl,
        name: file.name,
        uploader: uid,
        public_id: public_id,
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

  // Render item da galeria
  function renderItem(docId, data) {
    const wrapper = document.createElement('div');
    wrapper.style = 'position:relative;border-radius:8px;overflow:hidden;background:rgba(255,255,255,0.02);cursor:pointer';
    wrapper.innerHTML = `
      <img src="${data.url}" alt="${(data.name || 'Foto')}" style="width:100%;height:120px;object-fit:cover;display:block">
      <button class="delete-btn" title="Remover" style="
        position:absolute;top:6px;right:6px;background:rgba(0,0,0,0.6);color:#fff;border:none;padding:6px 8px;border-radius:8px;cursor:pointer;font-size:0.9rem;">✖</button>
    `;

    // abrir imagem no modal / nova aba
    const img = wrapper.querySelector('img');
    img.addEventListener('click', () => {
      if (typeof openModal === 'function') openModal(data.url, data.name || '');
      else window.open(data.url, '_blank');
    });

    // Remover do Firestore (apenas local)
    const delBtn = wrapper.querySelector('.delete-btn');
    delBtn.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      const ok = confirm('Remover esta foto do álbum?');
      if (!ok) return;

      delBtn.disabled = true;
      delBtn.textContent = '...';

      try {
        await db.collection('photos').doc(docId).delete();
        console.log('Documento apagado do Firestore:', docId);

        wrapper.remove();
      } catch (err) {
        console.error('Erro ao remover foto:', err);
        alert('Erro ao remover a foto.');
        delBtn.disabled = false;
        delBtn.textContent = '✖';
      }
    });

    return wrapper;
  }

  // Escuta em tempo real
  db.collection('photos').orderBy('ts', 'asc').onSnapshot(snapshot => {
    if (!albumGrid) return;
    albumGrid.innerHTML = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const el = renderItem(doc.id, data);
      albumGrid.appendChild(el);
    });
  }, err => {
    console.error('Erro ao escutar photos', err);
  });

})();
