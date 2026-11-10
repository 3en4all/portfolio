// Wizualizacje produktów i scena demo (serwerownia + karta): zdjęcie z przyciskiem „Obejrzyj w 3D” otwiera okno (dialog #m3d) z modelem (splat z idol3D).
// Jedna przeglądarka naraz (telefony mają limit kontekstów WebGL); zamknięcie okna zwalnia model.
import * as GS from '@mkkellogg/gaussian-splats-3d';
import * as THREE from 'three';

const dlg = document.getElementById('m3d');
const box = dlg.querySelector('.v3d');
const st = box.querySelector('.st');
let viewer = null, nr = 0;

// GitHub Pages wysyła gzip z Content-Length mniejszym niż dane — pobieramy sami.
const blob = async p => { const r = await fetch(p); if (!r.ok) throw new Error(p + ' ' + r.status); return URL.createObjectURL(await r.blob()); };

const zwolnij = async () => {
    nr++;
    box.classList.remove('is-live');
    const v = viewer; viewer = null;
    // dispose() w 0.4.6 rzuca removeChild (element już odpięty), choć zasoby GPU zwalnia; płótno sprzątamy sami
    if (v) { try { await v.dispose(); } catch (e) { console.debug('produkty3d dispose:', e); } try { v.renderer?.dispose(); } catch (e) {} }
    box.querySelectorAll('canvas').forEach(c => c.remove());
};

const otworz = async btn => {
    await zwolnij();
    const moj = nr;
    st.textContent = 'Ładowanie modelu 3D…';
    dlg.showModal();
    try {
        // kamera: produkt od strony zdjęcia wejściowego (yaw, pitch idol, „góra” to -Y); scena demo ma stałe ujęcie
        const demo = btn.dataset.scena === 'demo';
        const yaw = +btn.dataset.yaw, p = +btn.dataset.pitch, r = +(btn.dataset.r || 1.2);
        const kamera = demo
            ? { pos: box.clientWidth < 600 ? [1.1, -0.6, 1.6] : [0.8, -0.45, 1.15], cel: [0, 0.05, 0.3] }
            : { pos: [r * Math.sin(yaw) * Math.cos(p), -r * Math.sin(p), r * Math.cos(yaw) * Math.cos(p)], cel: [0, 0, 0] };
        // własny renderer z kanałem alfa: tło okna (30% bieli) prześwituje przez scenę
        const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, premultipliedAlpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(0x000000, 0);
        renderer.setSize(box.clientWidth, box.clientHeight);
        box.appendChild(renderer.domElement);
        const v = new GS.Viewer({
            rootElement: box,
            renderer,
            cameraUp: [0, -1, 0],
            initialCameraPosition: kamera.pos,
            initialCameraLookAt: kamera.cel,
            sharedMemoryForWorkers: false,
            gpuAcceleratedSort: false,
            useBuiltInControls: true,
        });
        viewer = v;
        if (demo) {
            // szafy serwerowe + karta graficzna przed nimi, obrócona wzdłuż rzędu
            const [serwery, karta] = await Promise.all(['assets/3d/serwerownia.splat', 'assets/3d/karta.splat'].map(blob));
            if (moj !== nr) return; // okno zamknięte w trakcie
            await v.addSplatScenes([
                { path: serwery, format: GS.SceneFormat.Splat },
                { path: karta, format: GS.SceneFormat.Splat, position: [0, 0.12, 0.75], rotation: [0, 0.7071068, 0, 0.7071068], scale: [0.7, 0.7, 0.7] },
            ], false);
        } else {
            const url = await blob(btn.dataset.splat);
            if (moj !== nr) return;
            await v.addSplatScene(url, { format: GS.SceneFormat.Splat, showLoadingUI: false });
        }
        if (moj !== nr) return;
        v.start();
        if (v.controls) { v.controls.autoRotate = true; v.controls.autoRotateSpeed = demo ? 0.6 : 1.2; }
        box.classList.add('is-live');
    } catch (err) {
        console.warn('produkty3d:', err);
        if (moj === nr) st.textContent = 'Nie udało się wczytać modelu — zamknij i spróbuj ponownie';
    }
};

document.querySelectorAll('.prod .b3d').forEach(b => b.addEventListener('click', () => otworz(b)));
dlg.querySelector('.x').addEventListener('click', () => dlg.close());
dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); }); // klik w tło
dlg.addEventListener('close', zwolnij);
