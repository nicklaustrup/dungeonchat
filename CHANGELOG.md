## [1.2.0](https://github.com/nicklaustrup/dungeonchat/compare/v1.1.0...v1.2.0) (2025-10-01)


### Features

* add dark mode support to EncounterLibrary & PartyManagement ([31070ae](https://github.com/nicklaustrup/dungeonchat/commit/31070ae531074116947799b8b061ac47170cf0b3))
* Phase 2F Encounter Management System - complete implementation ([71eec1f](https://github.com/nicklaustrup/dungeonchat/commit/71eec1f6f3b9d8444ca1a86d18584dd5a4bd6f6a))
* Phase 2F Session Notes System - complete implementation ([e104525](https://github.com/nicklaustrup/dungeonchat/commit/e10452507cfe193083089bbec1b10c2661ca8a79))
* Phase 2F Sprint 3 - Calendar & Party Management System ([1d4c717](https://github.com/nicklaustrup/dungeonchat/commit/1d4c717d12d48e4563edbc8deb75da3d8cc703a8))
* **sprint4:** integrate encounters with sessions & initiative tracker\n\n- Added sessionService add/remove encounter reference helpers\n- Added initiativeService.seedFromEncounter to populate combatants\n- Extended EncounterLibrary/Encounters to link encounter to selected session and seed initiative\n- Added active encounter panel in SessionNotes\n- Introduced SessionQuickNav for cross-system navigation with status badges\n- Integrated quick nav into CampaignDashboard\n- Minor build size increase (~1.4 kB JS, 0.3 kB CSS) ([4a25a21](https://github.com/nicklaustrup/dungeonchat/commit/4a25a21b8abd01f7187a768fe491cd97014fa705))


### Bug Fixes

* Additional Sprint 3 fixes - formatGold null safety and calendar dark mode ([84a0b84](https://github.com/nicklaustrup/dungeonchat/commit/84a0b84ef28f2d0ca2b2a5a21b5ea2f73486b8a7))
* Critical fixes - PartyManagement roles, Calendar light mode, Encounter dark mode ([5b83fcd](https://github.com/nicklaustrup/dungeonchat/commit/5b83fcd7f4964b5e102e7aa448d700957e90ae86))
* Sprint 3 bug fixes - indexes, permissions, and null safety ([c254044](https://github.com/nicklaustrup/dungeonchat/commit/c25404431b34c1a4b8d15c76af600a59fc7c09f8))
* **theme:** remove white background fallback in SessionQuickNav\n\n- Changed --sqn-bg from cascading var() with [#ffffff](https://github.com/nicklaustrup/dungeonchat/issues/ffffff) fallback to explicit light gray ([#f8fafc](https://github.com/nicklaustrup/dungeonchat/issues/f8fafc))\n- Dark mode now properly overrides with dark background without hitting white fallback\n- Text colors on active buttons/badges remain white for proper contrast ([e19d921](https://github.com/nicklaustrup/dungeonchat/commit/e19d921324fcc9363507bb9e4f5e13548ed4634b)), closes [#f8](https://github.com/nicklaustrup/dungeonchat/issues/f8)

## [1.1.0](https://github.com/nicklaustrup/dungeonchat/compare/v1.0.2...v1.1.0) (2025-09-30)


### Features

* Complete campaign system with responsive design and dark mode support ([e35c7f2](https://github.com/nicklaustrup/dungeonchat/commit/e35c7f27399db75eacafa79a50dfc33dce58b046))

## [1.0.2](https://github.com/nicklaustrup/dungeonchat/compare/v1.0.1...v1.0.2) (2025-09-28)


### Bug Fixes

* mobile emoji quick reaction - update debounce keys to be per-message ([2ae6270](https://github.com/nicklaustrup/dungeonchat/commit/2ae6270f0b9874d97f9a98718b12acf0115bcf33))
* mobile select/deselect reaction debounce issue ([c7310d0](https://github.com/nicklaustrup/dungeonchat/commit/c7310d05eb4a30fe292ae312c9806c8978c78d41))

## [1.0.1](https://github.com/nicklaustrup/superchat/compare/v1.0.0...v1.0.1) (2025-09-28)


### Bug Fixes

* **image:** prevent ImagePreviewModal render loop via controlled/uncontrolled sync guard ([b251869](https://github.com/nicklaustrup/superchat/commit/b2518699862f06f16c6ac87c286eb14008c8df61))

## 1.0.0 (2025-09-26)
