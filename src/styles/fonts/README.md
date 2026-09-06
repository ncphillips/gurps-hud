# Fonts

`Barlow Semi Condensed` and `JetBrains Mono`, both under the
[SIL Open Font License 1.1](https://openfontlicense.org/), latin subset only, taken from Google
Fonts and self-hosted so the HUD renders on a Foundry server with no internet access.

They are referenced from `../gurps-hud.css` by their served module path
(`/modules/gurps-hud/styles/fonts/...`) rather than relatively: Vite's library build base64-inlines
any asset a stylesheet resolves, which would have added ~250 kB to the CSS.
