// Demo 3D: dwa modele z idol3D w jednej scenie. Ładowane dopiero po kliknięciu (ok. 10 MB).
import * as GS from '@mkkellogg/gaussian-splats-3d';

const box = document.getElementById('demo3d-view');
const btn = document.getElementById('demo3d-start');

btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.textContent = 'Ładowanie…';
    try {
        const viewer = new GS.Viewer({
            rootElement: box,
            cameraUp: [0, -1, 0], // idol: „góra” to -Y
            // wąski ekran: kamera dalej, żeby karta graficzna nie wypadała z kadru
            initialCameraPosition: box.clientWidth < 600 ? [1.1, -0.6, 1.6] : [0.8, -0.45, 1.15],
            initialCameraLookAt: [0, 0.05, 0.3],
            sharedMemoryForWorkers: false,
            gpuAcceleratedSort: false,
            useBuiltInControls: true,
        });
        // GitHub Pages wysyła gzip z Content-Length mniejszym niż dane, a loader biblioteki ufa temu nagłówkowi;
        // dlatego pobieramy sami i podajemy blob URL z prawdziwym rozmiarem.
        const blob = async p => { const r = await fetch(p); if (!r.ok) throw new Error(p + ' ' + r.status); return URL.createObjectURL(await r.blob()); };
        const [serwery, karta] = await Promise.all(['assets/3d/serwerownia.splat', 'assets/3d/karta.splat'].map(blob));
        await viewer.addSplatScenes([
            { path: serwery, format: GS.SceneFormat.Splat },
            // karta graficzna leży przed szafami, obrócona wzdłuż rzędu
            { path: karta, format: GS.SceneFormat.Splat,
              position: [0, 0.12, 0.75], rotation: [0, 0.7071068, 0, 0.7071068], scale: [0.7, 0.7, 0.7] },
        ], false);
        viewer.start();
        if (viewer.controls) { viewer.controls.autoRotate = true; viewer.controls.autoRotateSpeed = 0.6; }
        box.classList.add('is-live');
        window.demo3d = viewer;
    } catch (err) {
        console.warn('demo3d:', err);
        btn.disabled = false;
        btn.textContent = 'Nie udało się wczytać — spróbuj ponownie';
    }
});
