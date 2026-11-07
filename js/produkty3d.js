// Wizualizacje produktów: karta = zdjęcie + model 3D (splat z idol3D). Model ładowany po kliknięciu;
// naraz działa jedna przeglądarka, bo telefony mają limit kontekstów WebGL.
import * as GS from '@mkkellogg/gaussian-splats-3d';

let aktywny = null; // { viewer, box }

// GitHub Pages wysyła gzip z Content-Length mniejszym niż dane (jak w demo3d.js) — pobieramy sami.
const blob = async p => { const r = await fetch(p); if (!r.ok) throw new Error(p + ' ' + r.status); return URL.createObjectURL(await r.blob()); };

const zamknij = async () => {
    if (!aktywny) return;
    const { viewer, box } = aktywny;
    aktywny = null;
    box.classList.remove('is-live');
    // dispose() w 0.4.6 rzuca removeChild (element już odpięty), choć zasoby GPU zwalnia; płótno sprzątamy sami
    try { await viewer.dispose(); } catch (e) { console.debug('produkty3d dispose:', e); }
    box.querySelectorAll('canvas').forEach(c => c.remove());
};

document.querySelectorAll('.prod .v3d').forEach(box => {
    const btn = box.querySelector('button');
    const etykieta = btn.textContent;
    btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = 'Ładowanie…';
        try {
            await zamknij();
            // kamera od strony zdjęcia wejściowego: kierunek idol (yaw, pitch) w osiach pliku, „góra” to -Y
            const yaw = +box.dataset.yaw, p = +box.dataset.pitch, r = +(box.dataset.r || 1.2);
            const viewer = new GS.Viewer({
                rootElement: box,
                cameraUp: [0, -1, 0],
                initialCameraPosition: [r * Math.sin(yaw) * Math.cos(p), -r * Math.sin(p), r * Math.cos(yaw) * Math.cos(p)],
                initialCameraLookAt: [0, 0, 0],
                sharedMemoryForWorkers: false,
                gpuAcceleratedSort: false,
                useBuiltInControls: true,
            });
            aktywny = { viewer, box };
            await viewer.addSplatScene(await blob(box.dataset.splat), { format: GS.SceneFormat.Splat, showLoadingUI: false });
            viewer.start();
            if (viewer.controls) { viewer.controls.autoRotate = true; viewer.controls.autoRotateSpeed = 1.2; }
            box.classList.add('is-live');
        } catch (err) {
            console.warn('produkty3d:', err);
            await zamknij().catch(() => {});
            btn.textContent = 'Nie udało się wczytać — spróbuj ponownie';
            btn.disabled = false;
            return;
        }
        btn.textContent = etykieta;
        btn.disabled = false;
    });
});
