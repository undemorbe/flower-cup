# Flower Cup

Лендинг Flower Cup на Vite + Vue 3: главная с 3D-стаканчиком (Three.js, только на desktop), страницы букетов и семечек.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # сборка в dist/ (+ 404.html для SPA-роутинга на GitHub Pages)
```

## Где что

- `src/data/catalog.js` — букеты, семечки, составы, инструкции по уходу
- `src/data/site.js` — контакты (сейчас заглушки, заменить)
- `src/styles/tokens.css` — палитра и шрифты (из референса Flower Cup)
- `src/three/cupScene.js` — 3D-сцена: вращение мышью / стрелками, кнопка «Посадить стаканчик»
- `src/components/art/` — SVG-иллюстрации букетов и пакетиков семян

## Деплой на GitHub Pages

Workflow `.github/workflows/deploy.yml` собирает сайт на каждый push в `main` и публикует его.
Один раз в репозитории: **Settings → Pages → Source: GitHub Actions**.

Сайт будет доступен по адресу `https://<user>.github.io/<repo>/` — base-путь подставляется автоматически.
Для своего домена или репозитория `<user>.github.io` поменяйте `BASE_PATH` в workflow на `/`.
