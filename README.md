# ProHub — форум для разработчиков

Современный форум-платформа в стиле XenForo: ProHub (основной форум), Code Forum
(сообщество разработчиков), под-форумы, ресурсы, видео, гильдии, репутация,
квесты, AI-модерация и PWA-приложение.

> Прод: https://prohub-nexus.lovable.app

## Возможности

- 🧵 **Форумы**: ProHub, Code Forum и неограниченные под-форумы со своими ролями
- 📦 **Ресурсы**: загрузка/рейтинги/комментарии, AI-модерация
- 🎥 **Видео**: TikTok-стиль вертикальный свайпер
- 👥 **Гильдии**: внутренние роли, рейтинги, приглашения
- 💬 **Мессенджер**: real-time приватные чаты
- 🏆 **Геймификация**: репутация, квесты, ачивки, стрики, кастомные титулы
- 🎨 **Декорации ника**: эмодзи, флейр-иконки и стикеры в «liquid-glass» квадратике
- 🛡️ **Модерация**: warning points, авто-баны, AI-модерация контента, защищённые аккаунты
- 🔐 **Безопасность**: обязательная 2FA (TOTP), Turnstile, RLS на всех таблицах
- ↔️ **Перенос сессии**: переход между доменами-зеркалами без релогина (`/auth/handoff`)
- 📱 **PWA**: установка на телефон, push-уведомления, авто-обновление через service worker
- 🔌 **Расширения**: JSON-плагины (custom HTML/CSS/JS на hook-точках)

## Стек

- **Frontend**: React 18, Vite 5, TypeScript, Tailwind CSS v3, shadcn/ui, React Router
- **Backend**: Lovable Cloud (Supabase под капотом) — Postgres + RLS, Auth, Storage, Edge Functions
- **AI**: Lovable AI Gateway (Gemini / GPT-5) для модерации тем, видео, ресурсов и ролей
- **Realtime**: Supabase Realtime для тем, постов, чатов и presence
- **Тесты**: Vitest + React Testing Library

## Локальный запуск

```bash
bun install
bun run dev          # http://localhost:8080
bun run build        # прод-сборка
bunx vitest run      # тесты
```

Переменные окружения (`.env`) автогенерируются Lovable Cloud:
`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`.

## Структура

```
src/
  pages/        — роуты (Forum, CodeForum, SubForum, Profile, AdminPanel, …)
  components/   — UI + фичи (StyledUsername, StickerPicker, SeasonalCountdown, …)
  hooks/        — useUserRole, useReputation, usePageBackground, …
  integrations/ — автогенерируемый Supabase-клиент и типы
supabase/
  functions/    — Edge Functions (moderate-*, prohub-bot, sltv-callback, …)
  migrations/   — SQL-миграции
public/
  sw.js         — service worker (auto-update)
  manifest.webmanifest
```

## Кросс-доменный логин

Открой `/auth/handoff` на исходном домене → сгенерируй ссылку для целевого
зеркала → откройся по ней → сессия применяется через `supabase.auth.setSession`
и токены сразу вычищаются из URL.

## Деплой

Проект работает на Lovable. Жми **Publish** в редакторе — фронт обновляется,
edge-функции и миграции деплоятся автоматически.

## Лицензия

Проприетарный проект ProHub. Все права защищены.
