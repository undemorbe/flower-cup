# Сторонние компоненты

Сайт Flower Cup использует open-source библиотеки и шрифты. Проприетарная [LICENSE](LICENSE) на них не распространяется: каждый компонент остаётся под своей лицензией. Полные тексты лицензий лежат в `node_modules/<пакет>/LICENSE` после `npm install`.

Список ниже включает только то, что попадает в собранный сайт. Инструменты сборки (Vite, `@vitejs/plugin-vue`) в сайт не попадают.

## Библиотеки

| Компонент | Версия | Лицензия | Правообладатель |
| --- | --- | --- | --- |
| [Vue](https://github.com/vuejs/core) | 3.5 | MIT | Copyright (c) 2018-present, Yuxi (Evan) You |
| [Vue Router](https://github.com/vuejs/router) | 5.4 | MIT | Copyright (c) 2019-present Eduardo San Martin Morote |
| [three.js](https://github.com/mrdoob/three.js) | 0.187 | MIT | Copyright (c) 2010-2026 three.js authors |

Лицензия MIT разрешает коммерческое использование при условии, что уведомление об авторских правах передаётся вместе с кодом. Минификатор вырезает комментарии из бандла, поэтому при сборке тексты лицензий всех зависимостей из `dependencies` собираются в файл `/third-party-licenses.txt` рядом с сайтом (скрипт `scripts/third-party-licenses.mjs`).

## Шрифты

Шрифты подключены через пакеты [Fontsource](https://fontsource.org) и раздаются с нашего домена, без запросов к Google Fonts.

| Шрифт | Где используется | Лицензия | Правообладатель |
| --- | --- | --- | --- |
| [Cormorant Garamond](https://github.com/CatharsisFonts/Cormorant) | заголовки, крупный текст | SIL OFL 1.1 | Copyright 2015 The Cormorant Project Authors |
| [Rubik](https://github.com/googlefonts/rubik) | основной текст, интерфейс | SIL OFL 1.1 | Copyright 2015 The Rubik Project Authors |
| [Marck Script](https://fonts.google.com/specimen/Marck+Script) | рукописные пометки | SIL OFL 1.1 | Copyright (c) 2011, Denis Masharov, Marck Fogel. Reserved Font Name "Marck Script" |

SIL Open Font License 1.1 разрешает использовать шрифты на сайте и в коммерческом продукте; её текст тоже попадает в `/third-party-licenses.txt`. Сами файлы шрифтов нельзя продавать отдельно, а изменённую версию нельзя распространять под зарезервированным названием. Текст лицензии: https://openfontlicense.org

## Что сделано своими силами

Иллюстрации букетов, пакетиков семян и стадий жизни стаканчика (`src/components/art/`), а также 3D-сцена (`src/three/cupScene.js`) нарисованы кодом для Flower Cup. Сторонних изображений, моделей и фотографий в репозитории нет. Эти материалы защищены проприетарной лицензией, правообладатель - Борис Станков.

## Как обновлять этот файл

При добавлении зависимости, которая попадает в сайт (`dependencies` в `package.json`), допишите её сюда. Лицензию пакета можно посмотреть так:

```bash
node -p "require('./node_modules/<пакет>/package.json').license"
```

Пакеты под GPL, AGPL и другими «копилефт»-лицензиями не подключайте без согласования: они могут обязать открыть код сайта.
