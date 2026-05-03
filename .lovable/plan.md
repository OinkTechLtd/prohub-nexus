## Что делаем

### 1. Полноценный движок подфорумов `/f/:slug` (как Code Forum)
Сейчас `/f/gamegtaforum` — статичная заглушка. Делаем рабочий форум на тех же таблицах `sub_forums` / `sub_forum_categories` + добавляем темы/посты:

**Новые таблицы:**
- `sub_forum_topics` (id, sub_forum_id, category_id, user_id, title, content, views, is_pinned, is_locked, is_hidden, created_at, updated_at) + RLS как у `topics`.
- `sub_forum_posts` (id, topic_id, user_id, content, is_hidden, created_at, updated_at) + RLS как у `posts`.
- Реалтайм-публикация для обеих таблиц.

**Новые страницы (тематически берут цвета из `sub_forums`):**
- `SubForumPanel.tsx` — переписать: список категорий с количеством тем/постов, последняя активность, кнопка «Создать тему», шапка с лого/описанием, поиск.
- `SubForumCategoryView.tsx` — список тем категории, пагинация, пин/локи.
- `SubForumTopicView.tsx` — просмотр темы + ответы + быстрый редактор (BBCode toolbar, цитаты, лайки, баннер бана автора).
- `SubForumCreateTopic.tsx` — выбор категории (из `sub_forum_categories` текущего форума), заголовок, BBCode-редактор, сохранение в `sub_forum_topics`.
- Роуты: `/f/:slug`, `/f/:slug/c/:catSlug`, `/f/:slug/t/:topicId`, `/f/:slug/new` (с query `?cat=...`).
- Header подфорума с навигацией: Forum / Members / Resources (заглушка) / Создать тему — стилизуется под `primary_color`.

### 2. Создание тем и ответов
- Кнопка «Создать тему» на странице подфорума и категории → открывает `SubForumCreateTopic` с предзаполненным `category_id`.
- Ответ через `MessageInput`-подобный компонент прямо на странице темы; вставка в `sub_forum_posts` под RLS `auth.uid() = user_id`.
- Защита: 2FA-guard (через `use2FAGuard`), Turnstile при создании темы, проверка на бан (`is_user_banned`), проверка протекта.

### 3. RSS-ленты для подфорумов и категорий
Расширяем edge-функцию `rss-feed` (или создаём `subforum-rss`):
- `GET /functions/v1/rss-feed?forum=<slug>` — RSS только для одного подфорума.
- `GET /functions/v1/rss-feed?forum=<slug>&category=<catSlug>` — RSS одной категории.
- Без параметров — старая лента ProHub (как сейчас).
- В UI подфорума и категории добавить кнопку «RSS» с копированием ссылки.

### 4. Мобильная админка ≤360px
В `AdminPanel.tsx` и tab-компонентах:
- Tabs → горизонтальный скролл (`overflow-x-auto whitespace-nowrap`), иконки + короткие лейблы.
- Все таблицы (`AdminSubForumsTab`, `AdminInactiveRenameTab`, `AdminSettingsTab`, `AdminTemplatesTab`, `AdminPluginsTab`, `AdminSectionsTab`) обернуть в `overflow-x-auto`, на узких экранах — стак-карточки вместо table-row.
- Кнопки: `flex-wrap`, `min-w-0`, `truncate` для длинных slug/имён.
- Проверить inputs (`type=color` фиксированной ширины) — заменить на `w-full max-w-[120px]`.

### 5. Баннер «Заблокирован» везде
Сейчас полный `BannedUserBadge` только в Profile/TopicView. Добавляем `BannedUserInlineBadge` (компактный) или `BannedUserBadge` (полный):
- `TopicView.tsx`, `CodeForumTopicView.tsx`: уже есть в шапке поста — оставить.
- Списки тем (`CategoryView`, `ForumPanel`, `CodeForumCategoryView`, `CodeForumPanel`, `SubForum*`) — рядом с автором добавить `BannedUserInlineBadge`.
- `Resources.tsx`, `CodeForumResources.tsx`, `Videos.tsx`, `Members.tsx`, `CodeForumMembers.tsx`, `Bookmarks.tsx`, `Guilds.tsx`, `GuildView.tsx` — рядом с никами авторов.
- `ResourceView.tsx`, `VideoView.tsx`, `CodeForumResourceView.tsx` — у автора и в комментариях.
- `MiniProfileCard` — добавить полный `BannedUserBadge` сверху, если забанен.

### 6. Декорации никнейма в шапке профиля ProHub
В `Profile.tsx` блок `<h1>{username}` (строки 576–587) заменить на `<StyledUsername>` с включёнными flair (или вручную добавить `<UsernameFlair>`), чтобы префикс/суффикс/иконка отображались рядом с ником в шапке. То же на `CodeForumProfile.tsx` (проверить).

### 7. Возврат лендинга Code Forum
`CodeForumLanding.tsx` существует и привязан к `/codeforum/welcome`. Сделать его **корневым** для `/codeforum`:
- Если пользователь не заходил раньше (нет ключа `codeforum_visited` в localStorage) → редирект `/codeforum` → `/codeforum/welcome`.
- На `/codeforum/welcome` — кнопка «Войти на форум» → ставит ключ и идёт `/codeforum/forum`.
- В шапке Code Forum добавить ссылку «О Code Forum» → `/codeforum/welcome`.

### 8. Force-update сервис-воркера (актуальная версия для всех)
В `public/sw.js` поднять `SW_VERSION` до `v3.1`, в `main.tsx` добавить:
- `reg.update()` каждые 60 сек,
- слушатель `controllerchange` → `window.location.reload()`,
- обработчик `SW_UPDATED` уже есть — добавить toast «Доступна новая версия — обновляем…» перед reload.
Для безопасности добавить в `index.html` `<meta http-equiv="Cache-Control" content="no-cache">` для html-shell.

### 9. Новые фичи (чтобы было «вау»)
Подобрал лёгкие, но заметные:
- **«Что нового»-modal**: при изменении `forum_settings.key='changelog_version'` показываем юзеру одноразовый список изменений (читается из таблицы `forum_settings.value`, JSON-список). Админ редактирует через `AdminSettingsTab`.
- **Тренды дня** на главной (ProHub): топ-5 тем по росту просмотров/лайков за 24ч (виджет в сайдбаре).
- **Реакции на посты** (😂🔥👍❤️🎉) для `posts` — переиспользуем `message_reactions`-паттерн через новую таблицу `post_reactions` (если успеем — иначе только модалка changelog + тренды).

## Технические детали

**Миграции SQL** (через migration tool):
1. `sub_forum_topics`, `sub_forum_posts` + RLS + триггеры `update_updated_at_column`.
2. `post_reactions` (post_id, user_id, emoji, unique).
3. `forum_settings` запись `changelog_version` (значение через insert tool).
4. ALTER PUBLICATION supabase_realtime ADD TABLE для новых таблиц.

**Edge functions**:
- Расширить `rss-feed` (поддержка `?forum=&category=`) — без новых секретов.

**Файлы для правки**: `src/App.tsx` (роуты), `src/pages/SubForumPanel.tsx` (переписать), `src/pages/Profile.tsx` (header flair), `src/pages/CodeForumProfile.tsx`, все list-страницы (добавить inline-badge), `public/sw.js`, `src/main.tsx`, `src/components/admin/*` (моб. адаптив), `src/pages/AdminPanel.tsx` (tabs scroll), `src/components/MiniProfileCard.tsx` (баннер бана).

**Новые файлы**: `src/pages/SubForumCategoryView.tsx`, `src/pages/SubForumTopicView.tsx`, `src/pages/SubForumCreateTopic.tsx`, `src/components/SubForumHeader.tsx`, `src/components/ChangelogModal.tsx`, `src/components/TrendingTopics.tsx`.

После апрува выполню всё одним заходом.