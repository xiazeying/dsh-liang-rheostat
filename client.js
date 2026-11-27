/**
 * 小梁滑动变阻器 — Client half.
 *
 * One eight-stop slider immediately before the composer's model selector:
 *  - it cross-fades a whole-application wallpaper between two images per tier,
 *  - and it sets the current session's reasoning effort (off / low / high / max)
 *    to the pair of tiers the thumb lands in.
 *
 * The wallpaper lives behind the AppFrame and every column; the dark glass
 * token layer is installed through the theme service so it composes with the
 * active palette and unwinds cleanly when the plugin is disabled.
 */
window.__ModuleLoader__.load({
  id: '@local/liang-rheostat',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const NS = 'liangRheostat'
    const SOURCE = '@local/liang-rheostat'
    const BUILD = '1.0.7'
    const STORAGE_KEY = '@local/liang-rheostat/state/v1'
    const TRACK_INSET = 6
    const TIER_COUNT = 8
    const IMAGE_COUNT = TIER_COUNT * 2
    const SNAP_DELAY_MS = 180
    const ERROR_VISIBLE_MS = 7000
    const EFFORT_TIER_GROUP = { off: 0, low: 1, high: 2, max: 3 }
    let sliderInstanceSeq = 0

    const TIER_NAMES = [
      '小梁',
      '梁子',
      '梁叔',
      '梁半圣',
      '梁圣',
      '梁帝',
      '梁祖',
      '唯一真神',
    ]
    const TIER_EFFORTS = ['off', 'off', 'low', 'low', 'high', 'high', 'max', 'max']
    const EFFORT_LABELS = { off: 'Off', low: 'Low', high: 'High', max: 'Max' }
    const TIER_ACCENTS = [
      'var(--dsw-alias-state-business-primary)',
      'var(--dsw-alias-state-business-primary)',
      'var(--dsw-alias-state-done-primary)',
      'var(--dsw-alias-state-done-primary)',
      'var(--dsw-alias-state-warn-primary)',
      'var(--dsw-alias-state-warn-primary)',
      'var(--dsw-alias-state-error-primary)',
      'var(--dsw-alias-state-error-primary)',
    ]
    // Per-image darkening. Early photographs are bright stage shots; the late
    // ones are already dark, so they get a lighter scrim and stay readable.
    const IMAGE_SCRIMS = [
      0.46, 0.44, 0.37, 0.37, 0.35, 0.33, 0.27, 0.18,
      0.14, 0.14, 0.10, 0.11, 0.08, 0.03, 0.04, 0.01,
    ]
    // The later photographs are deliberately dark throne scenes. Lift them a
    // little so the wallpaper still reads through the glass tint.
    const IMAGE_BRIGHTNESS = [
      1, 1, 1, 1, 1, 1, 1, 1,
      1.08, 1.08, 1.12, 1.12, 1.18, 1.18, 1.24, 1.24,
    ]

    const EN = {
      slider: {
        label: 'Liang sliding rheostat',
        aria: 'Liang sliding rheostat: {tier}, reasoning {effort}',
        hint: 'Drag to choose a tier',
      },
      tier: {
        0: '小梁',
        1: '梁子',
        2: '梁叔',
        3: '梁半圣',
        4: '梁圣',
        5: '梁帝',
        6: '梁祖',
        7: '唯一真神',
      },
      effort: {
        off: 'Off',
        low: 'Low',
        high: 'High',
        max: 'Max',
      },
      error: {
        noSession: 'Open a session before changing reasoning effort.',
        noModel: 'Choose a model before changing reasoning effort.',
        noReasoning: 'This model does not expose reasoning levels.',
        unavailable: 'The model catalog is not ready yet. Try again.',
        catalogFailed: 'The model catalog failed to load: {message}',
        subagent: 'Reasoning is unavailable in subagent sessions.',
        unsupported: 'This model does not offer the {effort} level.',
        selectFailed: 'Could not change reasoning: {message}',
        sessionLocked: 'Another DSH window owns this session. Quit it and try again.',
      },
    }

    const ZH = {
      slider: {
        label: '小梁滑动变阻器',
        aria: '小梁滑动变阻器：{tier}，推理等级 {effort}',
        hint: '拖动选择档位',
      },
      tier: {
        0: '小梁',
        1: '梁子',
        2: '梁叔',
        3: '梁半圣',
        4: '梁圣',
        5: '梁帝',
        6: '梁祖',
        7: '唯一真神',
      },
      effort: {
        off: '关',
        low: '低',
        high: '高',
        max: '极',
      },
      error: {
        noSession: '请先打开一个会话，再调整推理等级。',
        noModel: '请先选择一个模型，再调整推理等级。',
        noReasoning: '当前模型没有提供推理等级。',
        unavailable: '模型目录尚未就绪，请稍后再试。',
        catalogFailed: '模型目录加载失败：{message}',
        subagent: '子代理会话不支持调整推理等级。',
        unsupported: '该模型不支持 {effort} 等级。',
        selectFailed: '切换推理等级失败：{message}',
        sessionLocked: '另一个 DSH 窗口正在写这个会话，请退出后重试。',
      },
    }

    const DICTS = {
      en: EN,
      zh: ZH,
      ja: EN,
      es: EN,
      fr: EN,
      de: EN,
      ru: EN,
      pt: EN,
    }

    /*
     * Dark base values copied from @deepseek-ai/dsh-client-ui-theme's dark
     * blocks, then the surfaces this plugin makes translucent are overridden
     * below. The full set keeps labels, cards, code blocks, menus, and status
     * colors coherent on the wallpapered canvas.
     */
    const DARK_TOKENS = `
      --shiki-token-constant: #4dabf7;
      --shiki-token-string: #69db7c;
      --shiki-token-comment: #adb5bd;
      --shiki-token-keyword: #faa2c1;
      --shiki-token-parameter: #ffa94d;
      --shiki-token-function: #b197fc;
      --shiki-token-string-expression: #8ce99a;
      --shiki-token-punctuation: #ced4da;
      --shiki-token-link: #74c0fc;

      --dsw-linear-gradient-think: linear-gradient(180deg, #151517 20.19%, rgba(21, 21, 23, 0) 100%);
      --dsw-linear-think-select: linear-gradient(180deg, #232325 20.19%, rgba(35, 35, 37, 0) 100%);

      --dsw-alias-bg-base: var(--dsw-static-neutral-bluish-950);
      --dsw-alias-bg-document-preview: var(--dsw-static-neutral-bluish-950);
      --dsw-alias-bg-document-selection: color-mix(in srgb, var(--dsw-static-blue-500) 40%, transparent);
      --dsw-alias-label-document-preview: var(--dsw-static-neutral-bluish-300);
      --dsw-alias-bg-layer-1: var(--dsw-static-neutral-bluish-875);
      --dsw-alias-bg-layer-2: var(--dsw-static-neutral-bluish-850);
      --dsw-alias-bg-layer-3: var(--dsw-static-neutral-bluish-800);
      --dsw-alias-bg-mask-1: rgba(0, 0, 0, 0.5);
      --dsw-alias-bg-mask-2: rgba(0, 0, 0, 0.2);
      --dsw-alias-bg-mask-3: rgba(0, 0, 0, 0.48);
      --dsw-alias-bg-mask-photo: rgba(0, 0, 0, 0.88);
      --dsw-alias-bg-mask-drop: rgba(39, 39, 48, 0.7);
      --dsw-alias-bg-module-platform: var(--dsw-static-neutral-bluish-800);
      --dsw-alias-bg-multi-select: var(--dsw-static-neutral-850);
      --dsw-alias-bg-overlay: var(--dsw-static-neutral-bluish-700);
      --dsw-alias-bg-skeleton: rgba(255, 255, 255, 0.08);
      --dsw-alias-border-inverted2: rgba(255, 255, 255, 0.08);
      --dsw-alias-border-inverted: rgba(255, 255, 255, 0.06);
      --dsw-alias-border-l1: rgba(255, 255, 255, 0.06);
      --dsw-alias-border-l2-darkmode-thin: rgba(255, 255, 255, 0.06);
      --dsw-alias-border-l2: rgba(255, 255, 255, 0.12);
      --dsw-alias-border-l3: rgba(255, 255, 255, 0.16);
      --dsw-alias-border-l4: rgba(255, 255, 255, 0.2);
      --dsw-alias-border-selected: var(--dsw-static-neutral-bluish-400);
      --dsw-alias-brand-primary-invert: var(--dsw-static-neutral-bluish-50);
      --dsw-alias-brand-primary-new-colorprimary-new-color: var(--dsw-static-deepseek-450);
      --dsw-alias-brand-primary: var(--dsw-static-neutral-bluish-50);
      --dsw-alias-brand-text: var(--dsw-static-neutral-bluish-50);
      --dsw-alias-button-contrast-fill: var(--dsw-static-neutral-bluish-50);
      --dsw-alias-button-elevated-fill: var(--dsw-static-neutral-bluish-750);
      --dsw-alias-button-floating-fill: var(--dsw-static-neutral-bluish-850);
      --dsw-alias-button-floating-hover: var(--dsw-static-neutral-bluish-800);
      --dsw-alias-button-ghost-active-border: var(--dsw-static-neutral-bluish-600);
      --dsw-alias-button-ghost-active-fill: var(--dsw-static-neutral-bluish-750);
      --dsw-alias-button-ghost-active-hover: var(--dsw-static-neutral-bluish-700);
      --dsw-alias-button-info-fill: var(--dsw-static-deepseek-400);
      --dsw-alias-button-info-hover: var(--dsw-static-deepseek-500);
      --dsw-alias-button-primary-dimmed: var(--dsw-static-neutral-bluish-750);
      --dsw-alias-button-primary-fill: var(--dsw-alias-brand-primary);
      --dsw-alias-button-primary-hover: var(--dsw-static-neutral-bluish-100);
      --dsw-alias-button-tool-bar-fill-invisible: rgba(31, 31, 31, 0.36);
      --dsw-alias-button-tool-bar-fill: rgba(84, 85, 87, 0.5);
      --dsw-alias-button-tool-bar-hover: rgba(84, 85, 87, 0.6);
      --dsw-alias-card-fill: var(--dsw-static-neutral-850);
      --dsw-alias-card-fill-hover: var(--dsw-static-neutral-800);
      --dsw-alias-card-tile-fill: color-mix(in srgb, var(--dsw-static-neutral-00) 5%, transparent);
      --dsw-alias-chart-messages: var(--dsw-static-blue-450);
      --dsw-alias-chart-system: var(--dsw-static-neutral-bluish-400);
      --dsw-alias-chart-tools: var(--dsw-static-violet-400);
      --dsw-alias-hovercard-bg: var(--dsw-static-neutral-bluish-850);
      --dsw-alias-hovercard-label-primary: var(--dsw-static-neutral-bluish-00);
      --dsw-alias-hovercard-label-secondary: var(--dsw-static-neutral-bluish-300);
      --dsw-alias-hovercard-label-tertiary: var(--dsw-static-neutral-bluish-400);
      --dsw-alias-hovercard-state-done: var(--dsw-static-violet-400);
      --dsw-alias-hovercard-state-error: var(--dsw-static-red-400);
      --dsw-alias-illustration-background: var(--dsw-static-neutral-bluish-850);
      --dsw-alias-illustration-backing: var(--dsw-static-neutral-bluish-750);
      --dsw-alias-illustration-detail: var(--dsw-static-neutral-bluish-600);
      --dsw-alias-illustration-inset: var(--dsw-alias-illustration-backing);
      --dsw-alias-illustration-shadow: var(--dsw-alias-illustration-backing);
      --dsw-alias-illustration-surface: var(--dsw-static-neutral-bluish-700);
      --dsw-alias-interactive-bg-active: rgba(255, 255, 255, 0.14);
      --dsw-alias-interactive-bg-hover-accent: rgba(255, 255, 255, 0.24);
      --dsw-alias-interactive-bg-hover-danger: rgba(242, 90, 90, 0.15);
      --dsw-alias-interactive-bg-hover-solid: var(--dsw-static-neutral-bluish-800);
      --dsw-alias-interactive-bg-hover: rgba(255, 255, 255, 0.08);
      --dsw-alias-json-tree-hover: rgb(232 234 237 / 5%);
      --dsw-alias-json-tree-icon: #9aa0a6;
      --dsw-alias-json-tree-keyword: #99c8ff;
      --dsw-alias-json-tree-number: #99c8ff;
      --dsw-alias-json-tree-property: #5db0d7;
      --dsw-alias-json-tree-punctuation: #e8eaed;
      --dsw-alias-json-tree-string: #f28b82;
      --dsw-alias-label-caption: var(--dsw-static-neutral-bluish-600);
      --dsw-alias-label-deep-diving: color-mix(in srgb, var(--dsw-static-deepseek-450) 55%, var(--dsw-static-neutral-bluish-400));
      --dsw-alias-label-deep-diving-shimmer: color-mix(in srgb, var(--dsw-static-blue-300) 65%, var(--dsw-static-deepseek-400));
      --dsw-alias-label-dimmed: var(--dsw-static-neutral-bluish-750);
      --dsw-alias-label-on-color: var(--dsw-static-neutral-bluish-00);
      --dsw-alias-label-primary-bluish: var(--dsw-static-neutral-bluish-50);
      --dsw-alias-label-primary-dimmed: var(--dsw-static-neutral-bluish-100);
      --dsw-alias-label-primary-foreground: var(--dsw-static-neutral-bluish-1000);
      --dsw-alias-label-primary-inverted: var(--dsw-static-neutral-bluish-800);
      --dsw-alias-label-primary: var(--dsw-static-neutral-bluish-50);
      --dsw-alias-label-secondary: var(--dsw-static-neutral-bluish-300);
      --dsw-alias-label-shimmer: color-mix(in srgb, var(--dsw-static-neutral-00) 45%, transparent);
      --dsw-alias-label-tertiary: var(--dsw-static-neutral-bluish-400);
      --dsw-alias-menu-icon: var(--dsw-alias-label-primary-dimmed);
      --dsw-alias-link: var(--dsw-static-deepseek-400);
      --dsw-alias-markdown-citation: var(--dsw-static-neutral-bluish-800);
      --dsw-alias-markdown-code-block-banner: var(--dsw-static-neutral-bluish-850);
      --dsw-alias-markdown-code-block: var(--dsw-static-neutral-bluish-900);
      --dsw-alias-markdown-code-segment-selected: var(--dsw-static-neutral-bluish-800);
      --dsw-alias-markdown-code-segment-unselected: var(--dsw-static-neutral-bluish-900);
      --dsw-alias-markdown-inline-code: var(--dsw-static-neutral-800);
      --dsw-alias-markdown-placeholder: var(--dsw-static-neutral-bluish-850);
      --dsw-alias-markdown-tag: var(--dsw-static-neutral-bluish-850);
      --dsw-alias-scrollbar-bg-l1: var(--dsw-static-neutral-700);
      --dsw-alias-scrollbar-bg-l2: var(--dsw-static-neutral-600);
      --dsw-alias-scrollbar-hover-l1: var(--dsw-static-neutral-600);
      --dsw-alias-scrollbar-hover-l2: var(--dsw-static-neutral-550);
      --dsw-alias-state-business-primary: var(--dsw-static-deepseek-400);
      --dsw-alias-state-business-tertiary: var(--dsw-static-deepseek-800);
      --dsw-alias-code-diff-added: var(--dsw-static-green-500-a12);
      --dsw-alias-code-diff-deleted: var(--dsw-static-red-400-a12);
      --dsw-alias-file-diff-added-bg: rgb(31, 49, 36);
      --dsw-alias-file-diff-added-gutter: rgb(19, 32, 22);
      --dsw-alias-file-diff-added-marker: rgb(65, 201, 119);
      --dsw-alias-file-diff-deleted-bg: rgb(60, 31, 27);
      --dsw-alias-file-diff-deleted-gutter: rgb(40, 19, 14);
      --dsw-alias-file-diff-deleted-marker: rgb(250, 66, 62);
      --dsw-alias-state-done-primary: var(--dsw-static-violet-400);
      --dsw-alias-state-error-primary: var(--dsw-static-red-400);
      --dsw-alias-state-error-secondary: var(--dsw-static-red-400);
      --dsw-alias-state-idle-primary: var(--dsw-static-neutral-600);
      --dsw-alias-state-success-primary: var(--dsw-static-green-500);
      --dsw-alias-state-success-secondary: var(--dsw-static-green-400);
      --dsw-alias-state-success-tertiary: var(--dsw-static-green-900);
      --dsw-alias-state-warn-label: var(--dsw-static-amber-600);
      --dsw-alias-state-warn-primary: var(--dsw-static-amber-500);
      --dsw-alias-state-warn-secondary: var(--dsw-static-amber-400);
      --dsw-alias-state-warn-tertiary: var(--dsw-static-amber-900);
      --dsw-alias-switch-thumb: var(--dsw-static-neutral-bluish-400);
      --dsw-alias-toast-action: var(--dsw-static-deepseek-400);
      --dsw-alias-toast-bg: var(--dsw-static-neutral-bluish-750);
      --dsw-alias-toast-label: var(--dsw-static-neutral-bluish-00);
      --dsw-alias-turn-trigger-bg: var(--dsw-alias-interactive-bg-hover);
      --dsw-alias-turn-trigger-bg-hover: var(--dsw-alias-interactive-bg-active);
      --dsw-alias-tooltip-bg: var(--dsw-static-neutral-bluish-750);
      --dsw-alias-tooltip-key-bg: color-mix(in srgb, var(--dsw-alias-tooltip-bg), white 18%);
      --dsw-alias-tooltip-label: var(--dsw-static-neutral-bluish-00);
      --dsw-alias-trajectory-accent: var(--dsw-static-blue-500);
      --dsw-specific-bubble-highlight: var(--dsw-static-neutral-bluish-750);
      --dsw-specific-bubble: var(--dsw-static-neutral-bluish-850);
      --dsw-specific-file-upload-track: rgba(0, 0, 0, 0.08);
      --dsw-specific-guide-hero: var(--dsw-static-neutral-700);
      --dsw-specific-sidebar-right-flash: var(--dsw-static-neutral-00);
      --dsw-specific-input-major: var(--dsw-static-neutral-bluish-850);
      --dsw-specific-login-input: var(--dsw-static-neutral-bluish-900);
      --dsw-menu-surface-fill: rgba(48, 49, 54, 0.64);
      --dsw-alias-menu-group-header-fill: rgba(48, 49, 54, 0.94);
      --dsw-specific-menu: var(--dsw-menu-surface-fill);
      --dsw-specific-selector: var(--dsw-static-neutral-bluish-800);
      --dsw-specific-sidebar-fill: var(--dsw-static-neutral-bluish-900);
      --dsw-specific-sidebar-nav-item-active-accent: var(--dsw-static-neutral-bluish-800);
      --dsw-specific-sidebar-nav-item-active: var(--dsw-static-neutral-bluish-750);
      --dsw-specific-tip: var(--dsw-static-neutral-bluish-800);

      --dsw-alias-bg-base: #000000;
    `

    /*
     * Glass overrides. Every surface that would otherwise be opaque is given a
     * low-alpha dark fill, so the wallpaper shows through while light labels
     * stay readable. The frame and the conversation root each add one bg-base
     * layer, which is what leaves roughly half the photograph visible.
     */
    const GLASS_OVERRIDES = `
      --dsw-alias-bg-base: rgba(7, 9, 14, 0.26);
      --dsw-alias-bg-layer-1: rgba(15, 17, 25, 0.64);
      --dsw-alias-bg-layer-2: rgba(21, 23, 33, 0.72);
      --dsw-alias-bg-layer-3: rgba(27, 29, 41, 0.78);
      --dsw-alias-bg-overlay: rgba(16, 18, 26, 0.95);
      --dsw-alias-bg-module-platform: rgba(22, 24, 34, 0.70);
      --dsw-alias-bg-multi-select: rgba(30, 32, 44, 0.84);
      --dsw-specific-sidebar-fill: rgba(7, 9, 14, 0.16);
      --dsw-specific-sidebar-nav-item-active: rgba(255, 255, 255, 0.12);
      --dsw-specific-sidebar-nav-item-active-accent: rgba(255, 255, 255, 0.08);
      --dsw-specific-input-major: rgba(16, 18, 26, 0.68);
      --dsw-specific-selector: rgba(255, 255, 255, 0.10);
      --dsw-specific-tip: rgba(26, 28, 38, 0.94);
      --dsw-specific-file-upload-track: rgba(255, 255, 255, 0.06);
      --dsw-menu-surface-fill: rgba(18, 20, 28, 0.88);
      --dsw-alias-menu-group-header-fill: rgba(18, 20, 28, 0.95);
      --dsw-alias-card-fill: rgba(21, 23, 33, 0.66);
      --dsw-alias-card-fill-hover: rgba(29, 31, 43, 0.76);
      --dsw-alias-tooltip-bg: rgba(26, 28, 38, 0.96);
      --dsw-alias-markdown-code-block: rgba(8, 10, 16, 0.72);
      --dsw-alias-markdown-code-block-banner: rgba(16, 18, 26, 0.84);
      --dsw-alias-markdown-inline-code: rgba(255, 255, 255, 0.10);
      --dsw-alias-markdown-citation: rgba(255, 255, 255, 0.12);
      --dsw-alias-interactive-bg-hover: rgba(255, 255, 255, 0.08);
      --dsw-alias-interactive-bg-active: rgba(255, 255, 255, 0.14);
      --dsw-alias-interactive-bg-hover-solid: rgba(255, 255, 255, 0.10);
      --dsw-alias-border-l1: rgba(255, 255, 255, 0.06);
      --dsw-alias-border-l2: rgba(255, 255, 255, 0.12);
      --dsw-alias-border-l3: rgba(255, 255, 255, 0.16);
      --dsw-alias-border-l4: rgba(255, 255, 255, 0.22);
    `

    const WALLPAPER_CSS = `
html {
  background-color: #05070c;
  background-image: radial-gradient(120% 100% at 50% 0%, #10131c 0%, #05070c 60%, #020308 100%);
  color-scheme: dark !important;
}

/* The base stylesheet paints the body with --dsw-alias-bg-base; keep that fill
   off the body so the fixed wallpaper layers below it are not doubled. The
   AppFrame and ConversationRoot still apply their own bg-base tint. */
/* Keep the body's own page fill off the fixed wallpaper layer and isolate the
   body so its negative z-index children paint above that fill, not behind it.
   Without the isolation the desktop boot fill covers the photograph. */
body {
  background-color: transparent !important;
  isolation: isolate;
}

/* The main panel is the column that carries the conversation, the workspace
   pages, and the settings pages. It gets a lighter tint than the frame so the
   photograph stays visible behind the transcript while the sidebar keeps its
   deeper glass. The renderer's addressable main-slot wrapper is the stable
   anchor used by the shipped UI for the same purpose. */
[data-slot='main'] {
  --dsw-alias-bg-base: rgba(7, 9, 14, 0.10);
}

[data-slot='sidebar'] {
  --dsw-specific-sidebar-fill: rgba(7, 9, 14, 0.10);
}

/* Some desktop compositions paint the columns with opaque theme fills before
   the wallpaper layer existed. Clear only the frame columns that carry the
   sidebar and main panel; right/bottom follow the same shared surface. */
[data-slot='root'] > div > div:has([data-slot='sidebar']),
[data-slot='root'] > div > div:has([data-slot='main']),
[data-slot='root'] > div [data-rightbar-col],
[data-slot='root'] > div [data-shell-bottom] {
  background: transparent !important;
}

/* The composer's own footer band is tinted with bg-base. With a translucent
   base the transcript can ghost through the 36px band above the card, so add a
   short dark veil on the card's upper edge. data-composer-card is the stable
   attribute the composer paints on its capsule. */
[data-composer-card]::before {
  content: '';
  position: absolute;
  right: 0;
  bottom: 100%;
  left: 0;
  height: 36px;
  background: linear-gradient(to top, rgba(7, 9, 14, 0.55), rgba(7, 9, 14, 0));
  pointer-events: none;
}

body::before,
body::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-color: transparent;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  filter: brightness(var(--lr-brightness, 1));
  opacity: 0;
  transition: opacity 1250ms cubic-bezier(0.22, 0.61, 0.36, 1);
  will-change: opacity;
}

body::before {
  background-image: var(--lr-bg-a);
  filter: brightness(var(--lr-brightness-a, 1));
  opacity: var(--lr-op-a, 1);
}

body::after {
  background-image: var(--lr-bg-b);
  filter: brightness(var(--lr-brightness-b, 1));
  opacity: var(--lr-op-b, 0);
}

/* The AppFrame is the one stable element that covers the whole application.
   Paint the wallpaper inside it so the sidebar, center column, and conversation
   all share it. The layer sits above the frame background and below the grid
   columns; isolation keeps that negative z-index inside the frame. */
[data-slot='root'] > div {
  background: transparent !important;
  isolation: isolate;
}

[data-slot='root'] > div::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-image: var(--lr-frame-bg, none);
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  filter: brightness(var(--lr-frame-brightness, 1));
  opacity: var(--lr-frame-opacity, 1);
  transition: opacity 1250ms cubic-bezier(0.22, 0.61, 0.36, 1);
  will-change: opacity;
}

@media (prefers-reduced-motion: reduce) {
  body::before,
  body::after {
    transition: none;
  }

  [data-slot='root'] > div::after {
    transition: none;
  }
}
`

    const SLIDER_CSS = `
.lr-rheostat {
  --lr-accent: var(--dsw-alias-state-business-primary);
  position: relative;
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
  width: 192px;
  height: 28px;
  padding: 0 2px;
  box-sizing: border-box;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 20px;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}

.lr-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.lr-end {
  flex: none;
  max-width: 50px;
  padding: 0;
  overflow: hidden;
  border: 0;
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  font: inherit;
  line-height: 20px;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;
}

.lr-end:first-child {
  text-align: left;
}

.lr-end:last-child {
  text-align: right;
}

.lr-end:hover,
.lr-end[data-active='true'] {
  color: var(--dsw-alias-label-primary);
}

.lr-track-wrap {
  position: relative;
  flex: 1 1 auto;
  min-width: 72px;
  height: 28px;
  outline: none;
  cursor: pointer;
  touch-action: none;
}

.lr-track-wrap:focus-visible::after {
  content: '';
  position: absolute;
  inset: -2px 0;
  border-radius: var(--dsw-radius-sm);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--lr-accent) 55%, transparent);
  pointer-events: none;
}

.lr-track {
  position: absolute;
  top: 50%;
  right: ${TRACK_INSET}px;
  left: ${TRACK_INSET}px;
  height: 3px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--dsw-alias-border-l2);
  transform: translateY(-50%);
}

.lr-fill {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  border-radius: inherit;
  background: linear-gradient(
    90deg,
    var(--dsw-alias-state-business-primary),
    var(--dsw-alias-state-done-primary),
    var(--dsw-alias-state-warn-primary),
    var(--dsw-alias-state-error-primary)
  );
  opacity: 0.9;
  transition: width 140ms ease;
}

.lr-rheostat[data-dragging='true'] .lr-fill {
  transition: none;
}

.lr-node {
  position: absolute;
  top: 50%;
  width: 5px;
  height: 5px;
  box-sizing: border-box;
  border: 1px solid var(--dsw-alias-border-l3);
  border-radius: 50%;
  background: var(--dsw-alias-bg-overlay);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.lr-node[data-past='true'] {
  border-color: transparent;
  background: color-mix(in srgb, var(--lr-accent) 55%, var(--dsw-alias-bg-overlay));
}

.lr-node[data-active='true'] {
  width: 7px;
  height: 7px;
  border-color: transparent;
  background: var(--lr-accent);
  box-shadow: 0 0 8px color-mix(in srgb, var(--lr-accent) 60%, transparent);
}

.lr-thumb {
  position: absolute;
  top: 50%;
  width: 13px;
  height: 13px;
  box-sizing: border-box;
  border: 2px solid var(--lr-accent);
  border-radius: 50%;
  background: var(--dsw-alias-bg-layer-1);
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--lr-accent) 14%, transparent),
    0 1px 4px rgba(0, 0, 0, 0.5);
  transform: translate(-50%, -50%);
  pointer-events: none;
  transition:
    left 180ms cubic-bezier(0.2, 0.7, 0.3, 1),
    border-color 220ms ease,
    box-shadow 220ms ease;
}

.lr-rheostat[data-dragging='true'] .lr-thumb {
  transition:
    border-color 220ms ease,
    box-shadow 220ms ease;
}

.lr-bubble {
  position: absolute;
  bottom: calc(100% - 2px);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 190px;
  padding: 3px 8px;
  border: 0.5px solid var(--dsw-alias-border-l3);
  border-radius: var(--dsw-radius-sm);
  background: var(--dsw-alias-bg-overlay);
  box-shadow: var(--dsw-elevation-soft);
  color: var(--dsw-alias-label-primary);
  font-size: 11px;
  line-height: 16px;
  white-space: nowrap;
  pointer-events: none;
  transform: translateX(-50%);
  z-index: 5;
}

.lr-bubble-effort {
  padding: 0 4px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--lr-bubble-accent) 22%, transparent);
  color: var(--lr-bubble-accent);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.lr-bubble-build {
  color: var(--dsw-alias-label-caption);
  font-size: 9px;
  letter-spacing: 0.02em;
}

.lr-error {
  position: absolute;
  bottom: calc(100% + 18px);
  left: 50%;
  max-width: 260px;
  padding: 4px 8px;
  border: 0.5px solid var(--dsw-alias-state-error-primary);
  border-radius: var(--dsw-radius-sm);
  background: var(--dsw-alias-bg-overlay);
  box-shadow: var(--dsw-elevation-soft);
  color: var(--dsw-alias-state-error-primary);
  font-size: 11px;
  line-height: 16px;
  white-space: normal;
  transform: translateX(-50%);
  z-index: 6;
}

@media (prefers-reduced-motion: reduce) {
  .lr-fill,
  .lr-thumb {
    transition: none;
  }
}

@container (max-width: 640px) {
  .lr-rheostat {
    width: 172px;
    gap: 6px;
  }

  .lr-track-wrap {
    min-width: 56px;
  }

  .lr-end {
    max-width: 46px;
    font-size: 11px;
  }
}

@container (max-width: 480px) {
  .lr-rheostat {
    width: 162px;
  }

  .lr-track-wrap {
    min-width: 40px;
  }

  .lr-end {
    max-width: 46px;
    font-size: 11px;
  }
}
`

    const CSS = WALLPAPER_CSS + SLIDER_CSS

    function parseTokenCss(css) {
      const tokens = {}
      for (const line of css.split(/\r?\n/)) {
        const match = /^\s*(--[A-Za-z0-9_-]+)\s*:\s*(.+?);\s*$/.exec(line)
        if (match === null) continue
        tokens[match[1]] = { light: match[2], dark: match[2] }
      }
      return tokens
    }

    const THEME_TOKENS = parseTokenCss(DARK_TOKENS + '\n' + GLASS_OVERRIDES)

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value))
    }

    function clampTier(value) {
      return clamp(Math.round(Number(value) || 0), 0, TIER_COUNT - 1)
    }

    function imageUrl(index) {
      return '/plugins/@local/liang-rheostat/assets/wallpaper/' + index + '.jpg'
    }

    function tierOfImage(index) {
      return clamp(Math.floor((index - 1) / 2), 0, TIER_COUNT - 1)
    }

    function backgroundImage(index) {
      const n = clamp(Math.round(Number(index) || 1), 1, IMAGE_COUNT)
      const scrim = IMAGE_SCRIMS[n - 1]
      const top = Math.min(0.70, scrim + 0.08)
      const mid = scrim
      const bottom = Math.min(0.82, scrim + 0.14)
      const vignette = Math.min(0.8, scrim + 0.18)
      return [
        `radial-gradient(135% 100% at 50% 28%, transparent 0%, rgba(2, 4, 9, ${vignette.toFixed(3)}) 100%)`,
        `linear-gradient(180deg, rgba(4, 6, 11, ${top.toFixed(3)}) 0%, rgba(4, 6, 11, ${mid.toFixed(3)}) 58%, rgba(4, 6, 11, ${bottom.toFixed(3)}) 100%)`,
        `url("${imageUrl(n)}")`,
      ].join(', ')
    }

    function loadImage(url) {
      return new Promise((resolve) => {
        const image = new Image()
        image.onload = () => { resolve(true) }
        image.onerror = () => { resolve(false) }
        image.src = url
      })
    }

    function preloadImage(index) {
      const image = new Image()
      image.decoding = 'async'
      image.src = imageUrl(index)
    }

    function preloadNeighbors(index) {
      const tier = tierOfImage(index)
      for (let current = Math.max(0, tier - 1); current <= Math.min(TIER_COUNT - 1, tier + 1); current += 1) {
        preloadImage(current * 2 + 1)
        preloadImage(current * 2 + 2)
      }
    }

    function loadState() {
      const initial = {
        tier: 0,
        imageIndex: 1,
        visits: [1, 0, 0, 0, 0, 0, 0, 0],
      }
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (raw === null) return initial
        const parsed = JSON.parse(raw)
        if (parsed === null || typeof parsed !== 'object') return initial
        const tier = Number(parsed.tier)
        if (Number.isInteger(tier) && tier >= 0 && tier < TIER_COUNT) initial.tier = tier
        const imageIndex = Number(parsed.imageIndex)
        if (Number.isInteger(imageIndex) && imageIndex >= 1 && imageIndex <= IMAGE_COUNT) {
          initial.imageIndex = imageIndex
        } else {
          initial.imageIndex = initial.tier * 2 + 1
        }
        if (Array.isArray(parsed.visits) && parsed.visits.length === TIER_COUNT) {
          initial.visits = parsed.visits.map(value => (Number(value) === 1 ? 1 : 0))
        }
      } catch {
        /* localStorage is optional; a blocked store simply starts fresh. */
      }
      return initial
    }

    function persist(state) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch {
        /* The slider still works for this page lifetime without persistence. */
      }
    }

    function createStore() {
      let state = loadState()
      const listeners = new Set()

      const get = () => state

      const subscribe = (listener) => {
        listeners.add(listener)
        return () => { listeners.delete(listener) }
      }

      const publish = () => {
        for (const listener of [...listeners]) listener()
      }

      const update = (next) => {
        state = next
        persist(state)
        publish()
      }

      const enterTier = (tier) => {
        const nextTier = clampTier(tier)
        if (nextTier === state.tier) return false
        const visits = state.visits.slice()
        const slot = visits[nextTier] === 1 ? 1 : 0
        visits[nextTier] = slot === 0 ? 1 : 0
        update({
          tier: nextTier,
          imageIndex: nextTier * 2 + slot + 1,
          visits,
        })
        return true
      }

      return { get, subscribe, enterTier }
    }

    function createWallpaper(store) {
      let container = null
      let layerA = null
      let layerB = null
      let active = 'a'
      let current = store.get().imageIndex
      let disposed = false
      let generation = 0
      let ensureTimer = null

      const makeLayer = () => {
        const layer = document.createElement('div')
        layer.style.cssText = [
          'position:absolute',
          'inset:0',
          'background-position:center',
          'background-repeat:no-repeat',
          'background-size:cover',
          'opacity:0',
          'transition:opacity 1100ms cubic-bezier(0.22, 0.61, 0.36, 1)',
          'will-change:opacity',
          'pointer-events:none',
        ].join(';')
        return layer
      }

      const paint = (layer, index, opacity) => {
        layer.style.backgroundImage = backgroundImage(index)
        layer.style.filter = 'brightness(' + String(IMAGE_BRIGHTNESS[index - 1] ?? 1) + ')'
        layer.style.opacity = opacity
      }

      const ensure = () => {
        if (disposed) return false
        if (typeof document.querySelector !== 'function') return false
        const frame = document.querySelector('[data-slot="root"] > div')
        if (frame === null) return false
        if (container === null) {
          container = document.createElement('div')
          container.setAttribute('data-lr-wallpaper', '')
          container.style.cssText = [
            'position:absolute',
            'inset:0',
            'z-index:-1',
            'overflow:hidden',
            'pointer-events:none',
          ].join(';')
          layerA = makeLayer()
          layerB = makeLayer()
          container.append(layerA, layerB)
          paint(layerA, current, '1')
        }
        if (!frame.contains(container)) frame.prepend(container)
        return true
      }

      const unsubscribe = store.subscribe(() => {
        const next = store.get().imageIndex
        if (next === current) return
        current = next
        if (container === null) return
        const target = active === 'a' ? layerB : layerA
        const old = active === 'a' ? layerA : layerB
        const token = ++generation
        void loadImage(imageUrl(next)).then((loaded) => {
          if (disposed || token !== generation || !loaded || container === null) return
          paint(target, next, '0')
          // Commit the incoming image while transparent, then cross-fade it
          // against the still-visible old layer.
          void target.offsetHeight
          window.requestAnimationFrame(() => {
            if (disposed || token !== generation) return
            target.style.opacity = '1'
            old.style.opacity = '0'
            active = active === 'a' ? 'b' : 'a'
            preloadNeighbors(next)
          })
        })
      })

      const tick = () => {
        if (disposed) return
        ensure()
        ensureTimer = window.setTimeout(tick, 1000)
      }
      ensureTimer = window.setTimeout(tick, 0)

      return {
        ensure,
        dispose() {
          disposed = true
          unsubscribe()
          if (ensureTimer !== null) window.clearTimeout(ensureTimer)
          if (container !== null) container.remove()
          container = null
          layerA = null
          layerB = null
        },
      }
    }

    function useStore(store) {
      const [value, setValue] = React.useState(store.get)
      React.useEffect(() => store.subscribe(() => { setValue(store.get()) }), [store])
      return value
    }

    function useTranslate(ctx) {
      const [revision, setRevision] = React.useState(0)
      React.useEffect(
        () => ctx.on('locale/change', () => { setRevision(value => value + 1) }),
        [ctx],
      )
      return React.useMemo(() => ctx.locale.bind(NS), [ctx, revision])
    }

    /**
     * Read the current session's shared model directory. The directory service
     * is optional: when it is absent or the session is an addressed subagent,
     * the slider keeps working for the wallpaper and the reasoning actions
     * surface their own error.
     */
    function useModelDirectoryState(ctx, sessionId) {
      const [value, setValue] = React.useState(null)
      React.useEffect(() => {
        if (sessionId === undefined) {
          setValue(null)
          return undefined
        }
        const models = ctx.get('modelDirectories')
        if (models === undefined) {
          setValue(null)
          return undefined
        }
        const sessions = ctx.get('sessions')
        if (sessions !== undefined && typeof sessions.subagentAddress === 'function') {
          try {
            if (sessions.subagentAddress(sessionId) !== undefined) {
              setValue(null)
              return undefined
            }
          } catch {
            /* The directory lookup below reports a missing scope. */
          }
        }
        let directory
        try {
          directory = models.directoryFor(sessionId)
        } catch {
          setValue(null)
          return undefined
        }
        const read = () => { setValue(directory.store.getSnapshot()) }
        read()
        return directory.store.subscribe(read)
      }, [ctx, sessionId])
      return value
    }

    function effectiveEffortOf(modelState) {
      if (modelState === null || modelState.current === null) return undefined
      if (modelState.current.reasoningEffort !== undefined) return modelState.current.reasoningEffort
      const group = modelState.groups.find(item => item.id === modelState.current.provider)
      const model = group === undefined
        ? undefined
        : group.models.find(item => item.id === modelState.current.model)
      return model === undefined || model.reasoning === undefined
        ? undefined
        : model.reasoning.defaultEffort
    }

    function effortText(t, effort) {
      const key = 'effort.' + effort
      const translated = t(key)
      return translated === key ? (EFFORT_LABELS[effort] ?? effort) : translated
    }

    function createSlider(ctx, store, wallpaper) {
      return function LiangRheostat(props) {
        const sessionId = props.sessionId
        const t = useTranslate(ctx)
        const state = useStore(store)
        const modelState = useModelDirectoryState(ctx, sessionId)
        const [position, setPosition] = React.useState(state.tier)
        const [hovered, setHovered] = React.useState(null)
        const [dragging, setDragging] = React.useState(false)
        const [status, setStatus] = React.useState(null)
        const trackRef = React.useRef(null)
        const pointerRef = React.useRef(null)
        const effortTimerRef = React.useRef(null)
        const pendingTierRef = React.useRef(null)
        const requestSeqRef = React.useRef(0)
        const hintIdRef = React.useRef(null)
        if (hintIdRef.current === null) hintIdRef.current = 'lr-hint-' + (++sliderInstanceSeq)

        const activeTier = state.tier
        const activeEffort = TIER_EFFORTS[activeTier]
        const accent = TIER_ACCENTS[activeTier]
        const effortLabel = effortText(t, activeEffort)
        const effectiveEffort = effectiveEffortOf(modelState)

        React.useEffect(() => {
          wallpaper.ensure()
        }, [wallpaper])

        React.useEffect(() => {
          if (!dragging) setPosition(state.tier)
        }, [state.tier, dragging])

        /* Opening a session, switching sessions, or changing effort from the
           host model menu moves the dial to that effort's pair. Choosing a tier
           here does not depend on this effect: the directory reaches the same
           group once the selection settles, so the group check is a no-op. */
        React.useEffect(() => {
          if (effectiveEffort === undefined) return
          const group = EFFORT_TIER_GROUP[effectiveEffort]
          if (group === undefined) return
          const tier = store.get().tier
          if (Math.floor(tier / 2) === group) return
          const first = group * 2
          store.enterTier(Math.abs(tier - first) <= Math.abs(tier - (first + 1)) ? first : first + 1)
        }, [effectiveEffort, store])

        React.useEffect(() => () => {
          if (effortTimerRef.current !== null) {
            window.clearTimeout(effortTimerRef.current)
            effortTimerRef.current = null
          }
        }, [])

        React.useEffect(() => {
          if (status === null) return undefined
          const timer = window.setTimeout(() => { setStatus(null) }, ERROR_VISIBLE_MS)
          return () => { window.clearTimeout(timer) }
        }, [status])

        const ratioFromClientX = (clientX) => {
          const track = trackRef.current
          if (track === null) return 0
          const rect = track.getBoundingClientRect()
          const inner = Math.max(1, rect.width - TRACK_INSET * 2)
          return clamp((clientX - rect.left - TRACK_INSET) / inner, 0, 1)
        }

        const applyEffort = async (tier) => {
          const effort = TIER_EFFORTS[tier]
          const token = ++requestSeqRef.current
          setStatus(null)
          if (sessionId === undefined) {
            setStatus(t('error.noSession'))
            return
          }
          const sessions = ctx.get('sessions')
          if (sessions !== undefined && typeof sessions.subagentAddress === 'function') {
            try {
              if (sessions.subagentAddress(sessionId) !== undefined) {
                setStatus(t('error.subagent'))
                return
              }
            } catch {
              /* A missing scope is reported by the directory lookup below. */
            }
          }
          const models = ctx.get('modelDirectories')
          if (models === undefined) {
            setStatus(t('error.unavailable'))
            return
          }
          let directory
          try {
            directory = models.directoryFor(sessionId)
          } catch (error) {
            const detail = error instanceof Error ? error.message : String(error)
            setStatus(/subagent/i.test(detail) ? t('error.subagent') : t('error.unavailable'))
            return
          }
          let directoryState = directory.store.getSnapshot()
          if (directoryState.current === null || directoryState.groups.length === 0) {
            try {
              await directory.load()
            } catch (error) {
              if (token === requestSeqRef.current) {
                const message = error instanceof Error ? error.message : String(error)
                const detail = directory.store.getSnapshot().error
                setStatus(/subagent/i.test(message)
                  ? t('error.subagent')
                  : detail === null || detail === undefined || detail === ''
                    ? t('error.unavailable')
                    : t('error.catalogFailed', { message: detail }))
              }
              return
            }
            if (token !== requestSeqRef.current) return
            directoryState = directory.store.getSnapshot()
          }
          const current = directoryState.current
          if (current === null) {
            setStatus(t('error.noModel'))
            return
          }
          const group = directoryState.groups.find(item => item.id === current.provider)
          const model = group === undefined
            ? undefined
            : group.models.find(item => item.id === current.model)
          if (model === undefined) {
            setStatus(t('error.noModel'))
            return
          }
          const efforts = model.reasoning === undefined ? [] : model.reasoning.efforts
          const match = efforts.find(item => item.id === effort)
          if (match === undefined) {
            setStatus(efforts.length === 0
              ? t('error.noReasoning')
              : t('error.unsupported', { effort: effortText(t, effort) }))
            return
          }
          const currentEffort = current.reasoningEffort === undefined
            ? (model.reasoning === undefined ? undefined : model.reasoning.defaultEffort)
            : current.reasoningEffort
          if (currentEffort === effort) return
          let result
          try {
            result = await directory.select({
              provider: current.provider,
              model: current.model,
              reasoningEffort: effort,
            })
          } catch (error) {
            if (token === requestSeqRef.current) {
              const message = error instanceof Error ? error.message : String(error)
              setStatus(/subagent/i.test(message)
                ? t('error.subagent')
                : t('error.selectFailed', { message }))
            }
            return
          }
          if (token !== requestSeqRef.current) return
          if (result !== undefined && !result.ok) {
            setStatus(result.error.code === 'session/writer-held'
              ? t('error.sessionLocked')
              : t('error.selectFailed', { message: result.error.message }))
          }
        }

        const commitTier = (tier, immediate) => {
          pendingTierRef.current = tier
          if (effortTimerRef.current !== null) {
            window.clearTimeout(effortTimerRef.current)
            effortTimerRef.current = null
          }
          const run = () => {
            effortTimerRef.current = null
            const pending = pendingTierRef.current
            pendingTierRef.current = null
            if (pending === null) return
            if (sessionId === undefined) {
              setStatus(t('error.noSession'))
              return
            }
            void applyEffort(pending)
          }
          if (immediate) run()
          else effortTimerRef.current = window.setTimeout(run, SNAP_DELAY_MS)
        }

        const selectTier = (tier) => {
          const next = clampTier(tier)
          store.enterTier(next)
          setPosition(next)
          setHovered(next)
          commitTier(next, true)
        }

        const onPointerDown = (event) => {
          if (event.button !== 0 || pointerRef.current !== null) return
          event.preventDefault()
          const track = event.currentTarget
          pointerRef.current = event.pointerId
          setDragging(true)
          setHovered(clampTier(Math.round(ratioFromClientX(event.clientX) * 7)))
          try {
            track.setPointerCapture(event.pointerId)
            track.focus({ preventScroll: true })
          } catch {
            /* Pointer capture is best-effort; keyboard access remains. */
          }
          const ratio = ratioFromClientX(event.clientX)
          setPosition(ratio * 7)
          const tier = clampTier(Math.round(ratio * 7))
          store.enterTier(tier)
          commitTier(tier, false)
        }

        const onPointerMove = (event) => {
          if (pointerRef.current === event.pointerId) {
            const ratio = ratioFromClientX(event.clientX)
            setPosition(ratio * 7)
            const tier = clampTier(Math.round(ratio * 7))
            if (tier !== store.get().tier) {
              store.enterTier(tier)
              setHovered(tier)
              commitTier(tier, false)
            }
            return
          }
          if (pointerRef.current !== null) return
          const tier = clampTier(Math.round(ratioFromClientX(event.clientX) * 7))
          setHovered(previous => (previous === tier ? previous : tier))
        }

        const finishPointer = (event, cancelled) => {
          if (pointerRef.current !== event.pointerId) return
          pointerRef.current = null
          try {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId)
            }
          } catch {
            /* The capture may already be gone. */
          }
          setDragging(false)
          const tier = cancelled
            ? store.get().tier
            : clampTier(Math.round(ratioFromClientX(event.clientX) * 7))
          store.enterTier(tier)
          setPosition(tier)
          setHovered(tier)
          commitTier(tier, true)
        }

        const onKeyDown = (event) => {
          const tier = store.get().tier
          let next = null
          if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = tier - 1
          else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = tier + 1
          else if (event.key === 'Home') next = 0
          else if (event.key === 'End') next = TIER_COUNT - 1
          else if (event.key === 'PageDown') next = tier + 2
          else if (event.key === 'PageUp') next = tier - 2
          if (next === null) return
          event.preventDefault()
          selectTier(next)
        }

        const thumbLeft = (ratio) => `calc(${TRACK_INSET}px + (100% - ${TRACK_INSET * 2}px) * ${ratio})`
        const bubbleTier = hovered === null ? null : clampTier(hovered)
        const nodes = []
        for (let index = 0; index < TIER_COUNT; index += 1) {
          nodes.push(h('span', {
            key: 'node-' + index,
            className: 'lr-node',
            'data-active': index === activeTier ? 'true' : undefined,
            'data-past': index <= activeTier ? 'true' : undefined,
            style: { left: thumbLeft(index / (TIER_COUNT - 1)) },
          }))
        }

        return h('div', {
          className: 'lr-rheostat',
          'data-dragging': dragging ? 'true' : undefined,
          'data-tier': activeTier,
          style: { '--lr-accent': accent },
          title: t('slider.label') + ' · v' + BUILD,
          onPointerLeave: () => { if (pointerRef.current === null) setHovered(null) },
        },
        h('span', { id: hintIdRef.current, className: 'lr-sr' }, t('slider.hint')),
        h('button', {
          type: 'button',
          className: 'lr-end',
          tabIndex: -1,
          'data-active': activeTier === 0 ? 'true' : undefined,
          'aria-label': TIER_NAMES[0],
          onClick: () => { selectTier(0) },
        }, TIER_NAMES[0]),
        h('div', {
          ref: trackRef,
          className: 'lr-track-wrap',
          role: 'slider',
          tabIndex: 0,
          'aria-label': t('slider.label'),
          'aria-describedby': hintIdRef.current,
          'aria-valuemin': 0,
          'aria-valuemax': TIER_COUNT - 1,
          'aria-valuenow': activeTier,
          'aria-valuetext': t('slider.aria', {
            tier: TIER_NAMES[activeTier],
            effort: effortLabel,
          }),
          'aria-orientation': 'horizontal',
          onPointerDown,
          onPointerMove,
          onPointerUp: (event) => { finishPointer(event, false) },
          onPointerCancel: (event) => { finishPointer(event, true) },
          onLostPointerCapture: (event) => { finishPointer(event, true) },
          onPointerEnter: (event) => {
            if (pointerRef.current !== null) return
            setHovered(clampTier(Math.round(ratioFromClientX(event.clientX) * 7)))
          },
          onKeyDown,
          onFocus: () => { setHovered(activeTier) },
          onBlur: () => { if (pointerRef.current === null) setHovered(null) },
        },
        h('div', { className: 'lr-track' },
          h('div', {
            className: 'lr-fill',
            style: { width: `${(position / (TIER_COUNT - 1)) * 100}%` },
          }),
        ),
        nodes,
        h('div', {
          className: 'lr-thumb',
          style: { left: thumbLeft(position / (TIER_COUNT - 1)) },
        }),
        bubbleTier === null ? null : h('div', {
          className: 'lr-bubble',
          style: {
            left: thumbLeft(bubbleTier / (TIER_COUNT - 1)),
            '--lr-bubble-accent': TIER_ACCENTS[bubbleTier],
          },
        },
        h('span', null, TIER_NAMES[bubbleTier]),
        h('span', { className: 'lr-bubble-effort' }, effortText(t, TIER_EFFORTS[bubbleTier])),
        h('span', { className: 'lr-bubble-build' }, 'v' + BUILD),
        )),
        h('button', {
          type: 'button',
          className: 'lr-end',
          tabIndex: -1,
          'data-active': activeTier === TIER_COUNT - 1 ? 'true' : undefined,
          'aria-label': TIER_NAMES[TIER_COUNT - 1],
          onClick: () => { selectTier(TIER_COUNT - 1) },
        }, TIER_NAMES[TIER_COUNT - 1]),
        status === null ? null : h('div', { className: 'lr-error', role: 'status' }, status),
        )
      }
    }

    return {
      inject: ['slots', 'theme', 'locale'],
      apply(ctx) {
        ctx.effect(
          () => ctx.locale.register(NS, DICTS),
          'liang-rheostat: locale dictionaries',
        )
        ctx.effect(
          () => ctx.theme.overrideTokens(SOURCE, THEME_TOKENS),
          'liang-rheostat: dark glass theme tokens',
        )
        ctx.effect(() => {
          const style = document.createElement('style')
          style.dataset.dshPlugin = SOURCE
          style.textContent = CSS
          document.head.append(style)
          return () => { style.remove() }
        }, 'liang-rheostat: wallpaper and slider styles')

        const store = createStore()
        const wallpaper = createWallpaper(store)
        ctx.effect(() => {
          wallpaper.ensure()
          return () => { wallpaper.dispose() }
        }, 'liang-rheostat: wallpaper cross-fade')

        const Slider = createSlider(ctx, store, wallpaper)
        ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
          name: 'conversation.input.right',
          id: 'liang-rheostat',
          order: 0,
        }, Slider))
      },
    }
  },
})
