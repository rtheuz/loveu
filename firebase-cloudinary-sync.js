// o nome do preset é LOVEUBRUNA
// cloud name: dx4ghtdut

(function () {
  if (typeof firebase === 'undefined') {
    console.error('Firebase SDK não encontrado. Inclua os scripts do Firebase antes deste arquivo.');
    return;
  }


  // ======= CONFIGURE AQUI =======
  const CLOUD_NAME = "dx4ghtdut";        // ex: 'minhaconta'
  const UPLOAD_PRESET = "LOVEUBRUNA";  // ex: 'album_unsigned'
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

  // Faz upload para Cloudinary via unsigned e pede delete_token (return_delete_token=true)
  async function uploadToCloudinary(file) {
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', UPLOAD_PRESET);
    // Solicita delete_token para permitir exclusão posterior sem usar API secret
    fd.append('return_delete_token', 'true');

    const resp = await fetch(url, { method: 'POST', body: fd });
    if (!resp.ok) throw new Error('Upload Cloudinary falhou: ' + resp.status + ' ' + resp.statusText);
    const json = await resp.json();
    return json; // inclui secure_url, public_id e possivelmente delete_token
  }

  // Faz upload para Cloudinary, depois registra a URL (e delete_token se houver) no Firestore
  async function uploadAndSave(file) {
    try {
      const uid = (auth.currentUser && auth.currentUser.uid) || 'anon';
      const cloudResp = await uploadToCloudinary(file);
      const imageUrl = cloudResp.secure_url || cloudResp.url;
      const public_id = cloudResp.public_id || null;
      const delete_token = cloudResp.delete_token || null;

      if (!imageUrl) throw new Error('Cloudinary não retornou URL');

      // salva no Firestore com os metadados, inclusive delete_token se houver
      await db.collection('photos').add({
        url: imageUrl,
        name: file.name,
        uploader: uid,
        public_id: public_id,
        delete_token: delete_token,
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

  // Função que chama o endpoint delete_by_token do Cloudinary
  async function deleteFromCloudinaryByToken(deleteToken) {
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/delete_by_token`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: deleteToken })
    });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      throw new Error('Falha ao deletar no Cloudinary: ' + resp.status + ' ' + resp.statusText + ' ' + txt);
    }
    return await resp.json();
  }

  // Renderiza um cartão da grid com botão remover
  function renderItem(docId, data) {
    const wrapper = document.createElement('div');
    wrapper.style = 'position:relative;border-radius:8px;overflow:hidden;background:rgba(255,255,255,0.02);cursor:pointer';
    wrapper.innerHTML = `
      <img src="${data.url}" alt="${(data.name || 'Foto')}" style="width:100%;height:120px;object-fit:cover;display:block">
      <button class="delete-btn" title="Remover" style="
        position:absolute;top:6px;right:6px;background:rgba(0,0,0,0.6);color:#fff;border:none;padding:6px 8px;border-radius:8px;cursor:pointer;font-size:0.9rem;">✖</button>
    `;
    const img = wrapper.querySelector('img');
    img.addEventListener('click', () => {
      if (typeof openModal === 'function') openModal(data.url, data.name || '');
      else window.open(data.url, '_blank');
    });

    const delBtn = wrapper.querySelector('.delete-btn');
    delBtn.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      const ok = confirm('Remover esta foto do álbum? Esta ação pode ser irreversível.');
      if (!ok) return;
      delBtn.disabled = true;
      delBtn.textContent = '...';
      try {
        // Se houver delete_token, tente apagar no Cloudinary primeiro
        if (data.delete_token) {
          try {
            await deleteFromCloudinaryByToken(data.delete_token);
            console.log('Arquivo removido do Cloudinary (por delete_token).');
          } catch (err) {
            console.warn('Falha ao remover no Cloudinary com delete_token:', err);
            // continuar para remover o doc localmente mesmo se falhar na nuvem
          }
        } else {
          // sem delete_token: não temos como apagar no Cloudinary a partir do cliente de maneira segura
          console.info('Nenhum delete_token disponível. O arquivo no Cloudinary poderá permanecer (órfão).');
        }

        // remover doc do Firestore
        await db.collection('photos').doc(docId).delete();
        console.log('Documento apagado do Firestore:', docId);
      } catch (err) {
        console.error('Erro ao remover foto:', err);
        alert('Erro ao remover a foto. Veja console para detalhes.');
        delBtn.disabled = false;
        delBtn.textContent = '✖';
        return;
      }
      // opcional: remover o elemento da UI imediatamente
      wrapper.remove();
    });

    return wrapper;
  }

  // Escuta mudanças em tempo real na coleção 'photos' e renderiza
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
