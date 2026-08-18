(() => {
    'use strict';

    // ─── State ────────────────────────────────────────────────
    const S = {
        radius: 1.0, height: 1.5, sharpness: 0.3, segments: 32,
        thickness: 0.1, hollow: true,
        eggColor: '#f5e6d3', bgColor: '#1a1a2e',
        spinX: 0, spinY: 360, spinZ: 0,
        duration: 3, resolution: 720
    };

    const presets = {
        spin:   { spinX: 0, spinY: 360, spinZ: 0, duration: 3 },
        wobble: { spinX: 15, spinY: 360, spinZ: 15, duration: 2 },
        tumble: { spinX: 360, spinY: 360, spinZ: 0, duration: 4 },
        vj:     { spinX: 360, spinY: 720, spinZ: 360, duration: 4 },
        chicken: { radius: 1.0, height: 1.5, sharpness: 0.3 },
        ostrich: { radius: 2.0, height: 2.5, sharpness: 0.2 },
        quail:   { radius: 0.6, height: 0.8, sharpness: 0.4 },
        dino:    { radius: 1.5, height: 2.0, sharpness: 0.1 }
    };

    // ─── Three.js ─────────────────────────────────────────────
    let scene, camera, renderer, controls, eggMesh;

    function initThree() {
        const c = document.getElementById('viewport');
        if (!c) return;
        scene = new THREE.Scene();
        scene.background = new THREE.Color(S.bgColor);
        camera = new THREE.PerspectiveCamera(45, c.clientWidth / c.clientHeight, 0.1, 1000);
        camera.position.set(0, 2, 5);
        renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
        renderer.setSize(c.clientWidth, c.clientHeight);
        c.innerHTML = '';
        c.appendChild(renderer.domElement);
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        scene.add(new THREE.AmbientLight(0x404040, 0.5));
        const dl = new THREE.DirectionalLight(0xffffff, 1);
        dl.position.set(5, 10, 5);
        scene.add(dl);
        scene.add(new THREE.GridHelper(10, 20, 0x333333, 0x1a1a1a));
        buildEgg();
        (function loop() { requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); })();
        window.addEventListener('resize', () => {
            camera.aspect = c.clientWidth / c.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(c.clientWidth, c.clientHeight);
        });
    }

    function buildEggGeometry() {
        const { radius, height, sharpness, segments, thickness, hollow } = S;
        const v = [], idx = [];
        for (let i = 0; i <= segments; i++) {
            const phi = Math.PI * i / segments;
            for (let j = 0; j < segments; j++) {
                const theta = 2 * Math.PI * j / segments;
                let r = radius, y = height * Math.cos(phi);
                if (y > 0) r *= 1.0 - (y / height) * sharpness;
                v.push(r * Math.sin(phi) * Math.cos(theta), y, r * Math.sin(phi) * Math.sin(theta));
            }
        }
        for (let i = 0; i < segments; i++)
            for (let j = 0; j < segments; j++) {
                const a = i * segments + j, b = i * segments + (j + 1) % segments;
                const c = (i + 1) * segments + (j + 1) % segments, d = (i + 1) * segments + j;
                idx.push(a, b, c, a, c, d);
            }
        if (hollow) {
            const n = v.length / 3;
            for (let i = 0; i <= segments; i++) {
                const phi = Math.PI * i / segments;
                for (let j = 0; j < segments; j++) {
                    const theta = 2 * Math.PI * j / segments;
                    let r = radius - thickness, y = height * Math.cos(phi);
                    if (y > 0) r *= 1.0 - (y / height) * sharpness;
                    v.push(r * Math.sin(phi) * Math.cos(theta), y, r * Math.sin(phi) * Math.sin(theta));
                }
            }
            for (let i = 0; i < segments; i++)
                for (let j = 0; j < segments; j++) {
                    const a = n + i * segments + j, b = n + i * segments + (j + 1) % segments;
                    const c = n + (i + 1) * segments + (j + 1) % segments, d = n + (i + 1) * segments + j;
                    idx.push(a, c, b, a, d, c);
                }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
        geo.setIndex(idx);
        geo.computeVertexNormals();
        return geo;
    }

    function buildEgg() {
        if (eggMesh) scene.remove(eggMesh);
        eggMesh = new THREE.Mesh(
            buildEggGeometry(),
            new THREE.MeshStandardMaterial({ color: S.eggColor, roughness: 0.4, metalness: 0.1, side: THREE.DoubleSide })
        );
        scene.add(eggMesh);
        if (scene) scene.background = new THREE.Color(S.bgColor);
    }

    // ─── Pages ────────────────────────────────────────────────
    function designPage() {
        return `
<div class="page page-block">
    <div class="panel">
        <div class="section"><h3>卵の形状</h3>
            ${slider('radius', 0.1, 3, 0.1, '半径')}
            ${slider('height', 0.5, 4, 0.1, '高さ')}
            ${slider('sharpness', 0, 1, 0.05, '上部の尖がり', 2)}
            ${slider('segments', 8, 64, 8, '解像度', 0)}
            <div class="cg cr"><input type="checkbox" id="hollow" ${S.hollow ? 'checked' : ''}><label for="hollow">中空</label></div>
        </div>
        <div class="section"><h3>色</h3>
            <div class="cg"><label>卵の色</label><input type="color" id="eggColor" value="${S.eggColor}"></div>
            <div class="cg"><label>背景色</label><input type="color" id="bgColor" value="${S.bgColor}"></div>
        </div>
        <div class="section"><h3>プリセット</h3>
            <div class="preset-grid">
                <button class="preset-btn" data-preset="chicken">鶏卵</button>
                <button class="preset-btn" data-preset="ostrich">駝鳥卵</button>
                <button class="preset-btn" data-preset="quail">鶉卵</button>
                <button class="preset-btn" data-preset="dino">恐竜卵</button>
            </div>
        </div>
        <button class="btn btn-p" onclick="EP.downloadSTL()">STL ダウンロード</button>
        <button class="btn btn-s" onclick="EP.downloadOBJ()">OBJ ダウンロード</button>
        <button class="btn btn-s" onclick="EP.downloadJSON()">JSON ダウンロード</button>
    </div>
    <div id="viewport"><div class="info-bar">マウスで回転 / スクロールでズーム</div></div>
</div>`;
    }

    function videoPage() {
        return `
<div class="page page-block">
    <div class="panel">
        <div class="section"><h3>卵の形状</h3>
            ${slider('radius', 0.1, 3, 0.1, '半径')}
            ${slider('height', 0.5, 4, 0.1, '高さ')}
            ${slider('sharpness', 0, 1, 0.05, '上部の尖がり', 2)}
            ${slider('segments', 8, 64, 8, '解像度', 0)}
            <div class="cg cr"><input type="checkbox" id="hollow" ${S.hollow ? 'checked' : ''}><label for="hollow">中空</label></div>
        </div>
        <div class="section"><h3>色</h3>
            <div class="cg"><label>卵の色</label><input type="color" id="eggColor" value="${S.eggColor}"></div>
            <div class="cg"><label>背景色</label><input type="color" id="bgColor" value="${S.bgColor}"></div>
        </div>
        <div class="section"><h3>回転</h3>
            ${slider('spinX', 0, 720, 10, 'X軸 (度)', 0)}
            ${slider('spinY', 0, 720, 10, 'Y軸 (度)', 0)}
            ${slider('spinZ', 0, 720, 10, 'Z軸 (度)', 0)}
        </div>
        <div class="section"><h3>映像</h3>
            ${slider('duration', 1, 10, 0.5, '秒数', 1)}
            <div class="cg"><label>解像度</label>
                <select id="resolution">
                    <option value="480">480p</option>
                    <option value="720" ${S.resolution === 720 ? 'selected' : ''}>720p</option>
                    <option value="1080" ${S.resolution === 1080 ? 'selected' : ''}>1080p</option>
                </select>
            </div>
        </div>
        <div class="section"><h3>プリセット</h3>
            <div class="preset-grid">
                <button class="preset-btn" data-vpreset="spin">くるくる</button>
                <button class="preset-btn" data-vpreset="wobble">こくり</button>
                <button class="preset-btn" data-vpreset="tumble">くるぶし</button>
                <button class="preset-btn" data-vpreset="vj">VJループ</button>
            </div>
        </div>
        <button class="btn btn-p" id="recordBtn" onclick="EP.record()">録画開始</button>
        <div class="progress" id="progressBar"><div class="progress-fill" id="progressFill"></div></div>
        <div class="status" id="status"></div>
        <video class="preview-video" id="preview" controls></video>
        <button class="btn btn-s" id="dlBtn" style="display:none" onclick="EP.downloadVideo()">ダウンロード</button>
    </div>
    <div id="viewport"><div class="info-bar">マウスで回転 / スクロールでズーム</div></div>
</div>`;
    }

    function exportPage() {
        return `
<div class="page page-block export-page">
    <h2>エクスポート</h2>
    <p>形式を選んでダウンロード</p>
    <div class="export-options">
        <div class="export-card" onclick="EP.downloadSTL()">
            <div class="icon">📦</div><h3>STL</h3><p>3Dプリンタ対応</p>
        </div>
        <div class="export-card" onclick="EP.downloadOBJ()">
            <div class="icon">📐</div><h3>OBJ</h3><p>汎用3D形式</p>
        </div>
        <div class="export-card" onclick="EP.downloadJSON()">
            <div class="icon">📋</div><h3>JSON</h3><p>頂点・面データ</p>
        </div>
        <div class="export-card" onclick="EP.record()">
            <div class="icon">🎬</div><h3>WebM 動画</h3><p>ブラウザ録画</p>
        </div>
    </div>
</div>`;
    }

    function slider(id, min, max, step, label, decimals = 0) {
        const val = S[id];
        return `<div class="cg"><label>${label}</label><div class="sr">
            <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}">
            <span class="v" id="${id}-val">${decimals ? val.toFixed(decimals) : val}</span></div></div>`;
    }

    // ─── Routing ──────────────────────────────────────────────
    function route() {
        const hash = location.hash || '#/';
        const container = document.getElementById('page-container');
        document.querySelectorAll('.nav-link').forEach(l => {
            l.classList.toggle('active', l.getAttribute('href') === hash);
        });
        if (hash === '#/video') container.innerHTML = videoPage();
        else if (hash === '#/export') container.innerHTML = exportPage();
        else container.innerHTML = designPage();
        bindInputs();
        initThree();
    }

    // ─── Bind ─────────────────────────────────────────────────
    function bindInputs() {
        ['radius', 'height', 'sharpness', 'segments', 'spinX', 'spinY', 'spinZ', 'duration'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('input', () => {
                S[id] = +el.value;
                const vEl = document.getElementById(id + '-val');
                if (vEl) vEl.textContent = id === 'duration' ? S[id].toFixed(1) : S[id];
                if (['radius', 'height', 'sharpness', 'segments'].includes(id)) buildEgg();
            });
        });
        const h = document.getElementById('hollow');
        if (h) h.addEventListener('change', () => { S.hollow = h.checked; buildEgg(); });
        const ec = document.getElementById('eggColor');
        if (ec) ec.addEventListener('input', () => { S.eggColor = ec.value; buildEgg(); });
        const bc = document.getElementById('bgColor');
        if (bc) bc.addEventListener('input', () => { S.bgColor = bc.value; buildEgg(); });
        const res = document.getElementById('resolution');
        if (res) res.addEventListener('change', () => { S.resolution = +res.value; });
        document.querySelectorAll('[data-preset]').forEach(btn => {
            btn.addEventListener('click', () => {
                const p = presets[btn.dataset.preset];
                Object.entries(p).forEach(([k, v]) => {
                    S[k] = v;
                    const el = document.getElementById(k);
                    if (el) { el.value = v; el.dispatchEvent(new Event('input')); }
                });
            });
        });
        document.querySelectorAll('[data-vpreset]').forEach(btn => {
            btn.addEventListener('click', () => {
                const p = presets[btn.dataset.vpreset];
                Object.entries(p).forEach(([k, v]) => {
                    S[k] = v;
                    const id = k.charAt(0).toUpperCase() + k.slice(1);
                    const el = document.getElementById(id);
                    if (el) { el.value = v; el.dispatchEvent(new Event('input')); }
                });
            });
        });
    }

    // ─── Egg Mesh Utils ───────────────────────────────────────
    function eggVertices() {
        const { radius, height, sharpness, segments, thickness, hollow } = S;
        const verts = [], faces = [];
        for (let i = 0; i <= segments; i++) {
            const phi = Math.PI * i / segments;
            for (let j = 0; j < segments; j++) {
                const theta = 2 * Math.PI * j / segments;
                let r = radius, y = height * Math.cos(phi);
                if (y > 0) r *= 1.0 - (y / height) * sharpness;
                verts.push([r * Math.sin(phi) * Math.cos(theta), y, r * Math.sin(phi) * Math.sin(theta)]);
            }
        }
        for (let i = 0; i < segments; i++)
            for (let j = 0; j < segments; j++) {
                const a = i * segments + j, b = i * segments + (j + 1) % segments;
                const c = (i + 1) * segments + (j + 1) % segments, d = (i + 1) * segments + j;
                faces.push([a, b, c], [a, c, d]);
            }
        if (hollow) {
            const n = verts.length;
            for (let i = 0; i <= segments; i++) {
                const phi = Math.PI * i / segments;
                for (let j = 0; j < segments; j++) {
                    const theta = 2 * Math.PI * j / segments;
                    let r = radius - thickness, y = height * Math.cos(phi);
                    if (y > 0) r *= 1.0 - (y / height) * sharpness;
                    verts.push([r * Math.sin(phi) * Math.cos(theta), y, r * Math.sin(phi) * Math.sin(theta)]);
                }
            }
            for (let i = 0; i < segments; i++)
                for (let j = 0; j < segments; j++) {
                    const a = n + i * segments + j, b = n + i * segments + (j + 1) % segments;
                    const c = n + (i + 1) * segments + (j + 1) % segments, d = n + (i + 1) * segments + j;
                    faces.push([a, c, b], [a, d, c]);
                }
        }
        return { verts, faces };
    }

    // ─── STL ──────────────────────────────────────────────────
    function toSTL() {
        const { verts, faces } = eggVertices();
        const buf = new ArrayBuffer(84 + faces.length * 50);
        const dv = new DataView(buf);
        // header
        faces.length.toLocaleString; // noop
        dv.setUint32(80, faces.length, true);
        let off = 84;
        for (const [ai, bi, ci] of faces) {
            const a = verts[ai], b = verts[bi], c = verts[ci];
            const e1 = [b[0]-a[0], b[1]-a[1], b[2]-a[2]];
            const e2 = [c[0]-a[0], c[1]-a[1], c[2]-a[2]];
            const n = [
                e1[1]*e2[2] - e1[2]*e2[1],
                e1[2]*e2[0] - e1[0]*e2[2],
                e1[0]*e2[1] - e1[1]*e2[0]
            ];
            const len = Math.sqrt(n[0]*n[0]+n[1]*n[1]+n[2]*n[2]) || 1;
            n[0] /= len; n[1] /= len; n[2] /= len;
            dv.setFloat32(off, n[0], true); off += 4;
            dv.setFloat32(off, n[1], true); off += 4;
            dv.setFloat32(off, n[2], true); off += 4;
            for (const v of [a, b, c]) {
                dv.setFloat32(off, v[0], true); off += 4;
                dv.setFloat32(off, v[1], true); off += 4;
                dv.setFloat32(off, v[2], true); off += 4;
            }
            dv.setUint16(off, 0, true); off += 2;
        }
        return new Blob([buf], { type: 'model/stl' });
    }

    // ─── OBJ ──────────────────────────────────────────────────
    function toOBJ() {
        const { verts, faces } = eggVertices();
        let s = '# Egg Parametric Model\n';
        for (const v of verts) s += `v ${v[0].toFixed(6)} ${v[1].toFixed(6)} ${v[2].toFixed(6)}\n`;
        for (const f of faces) s += `f ${f[0]+1} ${f[1]+1} ${f[2]+1}\n`;
        return new Blob([s], { type: 'model/obj' });
    }

    // ─── JSON ─────────────────────────────────────────────────
    function toJSON() {
        const { verts, faces } = eggVertices();
        const flat = [];
        for (const v of verts) flat.push(v[0], v[1], v[2]);
        const idx = [];
        for (const f of faces) idx.push(f[0], f[1], f[2]);
        return new Blob([JSON.stringify({ vertices: flat, indices: idx })], { type: 'application/json' });
    }

    // ─── Recording ────────────────────────────────────────────
    let recordedBlob = null;

    async function record() {
        const btn = document.getElementById('recordBtn');
        const status = document.getElementById('status');
        const bar = document.getElementById('progressBar');
        const fill = document.getElementById('progressFill');
        btn.disabled = true;
        btn.textContent = '録画中...';
        status.className = 'status loading';
        status.textContent = 'ブラウザで録画中...';
        bar.style.display = 'block';
        fill.style.width = '0%';

        const w = S.resolution === 1080 ? 1920 : S.resolution === 720 ? 1280 : 854;
        const h = S.resolution === 1080 ? 1080 : S.resolution === 720 ? 720 : 480;
        const origW = renderer.domElement.width, origH = renderer.domElement.height;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();

        const sx = S.spinX * Math.PI / 180, sy = S.spinY * Math.PI / 180, sz = S.spinZ * Math.PI / 180;
        const stream = renderer.domElement.captureStream(30);
        const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
        const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8000000 });
        const chunks = [];
        rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

        const done = new Promise(res => { rec.onstop = () => res(new Blob(chunks, { type: 'video/webm' })); });
        rec.start();

        const fps = 30, dur = S.duration;
        const startTime = performance.now();
        await new Promise(resolve => {
            (function loop() {
                const t = (performance.now() - startTime) / 1000;
                fill.style.width = Math.min(t / dur * 100, 100) + '%';
                if (eggMesh) {
                    eggMesh.rotation.x = sx * (t / dur);
                    eggMesh.rotation.y = sy * (t / dur);
                    eggMesh.rotation.z = sz * (t / dur);
                }
                renderer.render(scene, camera);
                t < dur ? requestAnimationFrame(loop) : (rec.stop(), resolve());
            })();
        });

        recordedBlob = await done;
        renderer.setSize(origW, origH);
        camera.aspect = origW / origH;
        camera.updateProjectionMatrix();
        if (eggMesh) eggMesh.rotation.set(0, 0, 0);

        const url = URL.createObjectURL(recordedBlob);
        const preview = document.getElementById('preview');
        preview.src = url;
        preview.style.display = 'block';
        document.getElementById('dlBtn').style.display = 'block';
        status.className = 'status done';
        status.textContent = `完了！ (${(recordedBlob.size / 1024 / 1024).toFixed(1)}MB)`;
        btn.disabled = false;
        btn.textContent = '録画開始';
    }

    // ─── Downloads ────────────────────────────────────────────
    function dl(blob, name) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        a.click();
    }

    // ─── Public API ───────────────────────────────────────────
    window.EP = {
        downloadSTL: () => dl(toSTL(), 'egg.stl'),
        downloadOBJ: () => dl(toOBJ(), 'egg.obj'),
        downloadJSON: () => dl(toJSON(), 'egg.json'),
        downloadVideo: () => { if (recordedBlob) dl(recordedBlob, 'egg_spin.webm'); },
        record
    };

    // ─── Init ─────────────────────────────────────────────────
    window.addEventListener('hashchange', route);
    route();

    // Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
})();
