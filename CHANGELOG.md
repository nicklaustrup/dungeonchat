## [1.3.0](https://github.com/nicklaustrup/dungeonchat/compare/v1.2.0...v1.3.0) (2025-10-02)


### Features

* Add context menu for clearing shapes with user-specific permissions ([6311ff3](https://github.com/nicklaustrup/dungeonchat/commit/6311ff37f3ac0a0d0be7c4ace2177c96fda9c4aa)), closes [#2a2a3](https://github.com/nicklaustrup/dungeonchat/issues/2a2a3) [#232334](https://github.com/nicklaustrup/dungeonchat/issues/232334)
* Add drag-and-drop light placement with visual preview ([7c4dd2e](https://github.com/nicklaustrup/dungeonchat/commit/7c4dd2e08ea36ff6c0b1fd22dab22d4adb750d2b))
* Add draggable light controls with context menu ([6356cd9](https://github.com/nicklaustrup/dungeonchat/commit/6356cd91efe2edcab49a79c04f1c9efa4d7c9f5e))
* Add FX Library dropdown with Lighting panel in MapCanvas ([d36e310](https://github.com/nicklaustrup/dungeonchat/commit/d36e3101d499025531e553305f1dd60e4172b866))
* Add intensity controls for flicker and pulse effects ([22799a4](https://github.com/nicklaustrup/dungeonchat/commit/22799a4e294790e8325e5a84cac2075ad7c03792))
* Add lighting fog reveal, player view toggle, and hidden token indicator ([98b9834](https://github.com/nicklaustrup/dungeonchat/commit/98b9834d726ea9b2fb67678665d99e1d5d2f956b))
* Add Phase 1 dynamic lighting system with hook parameter fixes ([61b9566](https://github.com/nicklaustrup/dungeonchat/commit/61b956698941719e5d8bf0a2a7092e85d09d5c09))
* Improve VTT fog rendering and reorganize canvas controls ([ccba212](https://github.com/nicklaustrup/dungeonchat/commit/ccba21276656b6da92db9e91ae259c994f8efdb8)), closes [#667](https://github.com/nicklaustrup/dungeonchat/issues/667) [#ff6b6](https://github.com/nicklaustrup/dungeonchat/issues/ff6b6)
* Show light radius indicator while dragging lights ([3c22e4e](https://github.com/nicklaustrup/dungeonchat/commit/3c22e4e60d4f3b359c11884f4bf9609c8b8c7e30))
* **vtt:** add global snap-to-grid and apply to tokens (drag preview + final position) ([205a20f](https://github.com/nicklaustrup/dungeonchat/commit/205a20f748e7a2b9058b8be88abdd77f75620e5e))
* **vtt:** add shape drawing tools (circle, rectangle, cone, line) with live preview, persistence, visibility, and toolbar settings ([a1e1e55](https://github.com/nicklaustrup/dungeonchat/commit/a1e1e550d9429aeca5d928dc0c46e53e7a3b0d27))
* **vtt:** grid configurator panel (live DM grid settings) ([27af6eb](https://github.com/nicklaustrup/dungeonchat/commit/27af6ebe69befad36851a6669192227258f0369e))
* **vtt:** pulsing bright highlight for token snap target cell ([d50b8b2](https://github.com/nicklaustrup/dungeonchat/commit/d50b8b2b9fe1a7be91de26db8dbe876cf26254fa))
* **vtt:** snap tokens to center of grid cell instead of intersections ([d8a86bc](https://github.com/nicklaustrup/dungeonchat/commit/d8a86bc0811cb94f9af80b3b9de0f2445dfcfa79))


### Bug Fixes

* Add Firestore rules for lights collection and optimize Konva layers ([3a19dff](https://github.com/nicklaustrup/dungeonchat/commit/3a19dff72057eace43ff61b6d45056493045621c))
* Enable lighting toggle button now works correctly ([85d3ed0](https://github.com/nicklaustrup/dungeonchat/commit/85d3ed0025a52ffcc7558349d338b36e5df68fd2))
* Global lighting toggle button now updates UI immediately ([d32868f](https://github.com/nicklaustrup/dungeonchat/commit/d32868fe480ce8d38f266d4c664022df13597a80))
* LightingPanel close button now works properly ([0a18fc9](https://github.com/nicklaustrup/dungeonchat/commit/0a18fc9a82879e6f78fa6e8ecff9acac64929dca))
* Lights now properly illuminate dark areas ([4324a09](https://github.com/nicklaustrup/dungeonchat/commit/4324a0956d4f27ae0edfd098135878e32e22671c))
* Lights now properly reveal map and tokens underneath ([e85c2c2](https://github.com/nicklaustrup/dungeonchat/commit/e85c2c2d085ffdfaa66942fc07cb9241a81c1aec))
* UI improvements - scrollable forms, condensed character sheet, moved player view button ([53f6d88](https://github.com/nicklaustrup/dungeonchat/commit/53f6d8805024ebaff86567ee163bebbad025c72c)), closes [#667](https://github.com/nicklaustrup/dungeonchat/issues/667) [#2d2d35](https://github.com/nicklaustrup/dungeonchat/issues/2d2d35)
* **vtt:** remove duplicate floating chat/party panels and auto-open sidebar; cleanup unused code for lint pass ([14c3d40](https://github.com/nicklaustrup/dungeonchat/commit/14c3d40c64909e8eb92780454ea29b0ba8a09aef))

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
