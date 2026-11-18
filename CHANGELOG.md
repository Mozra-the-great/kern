# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Core set of 27 Svelte 5 components (actions, status, forms, content, overlays,
  navigation), Stuffcloud and Flower themes, custom-elements build.
- 14 more components: Skeleton, EmptyState, Breadcrumb, Pagination, Navbar,
  Slider, FileDrop, Carousel, Popover, Combobox, ContextMenu, CommandPalette,
  TreeView, DatePicker, each with a custom-element wrapper. Overlays share
  `anchor.ts` for viewport-aware placement and shadow-DOM-safe focus handling.
- Repository scaffold from `repo-template-public`: CI (`build`, `workflow-lint`,
  `gitleaks`), Dependabot for GitHub Actions and npm, issue/PR templates.

### Changed
- License is GPL-3.0-or-later (was MIT in the first local import).

### Fixed
- `Field` no longer stretches inside grid rows (`align-content: start`).
- `package-lock.json` matches `package.json` again, so `npm ci` works.
