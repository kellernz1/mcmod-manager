# MCMod Manager

Desktop app built with Electron, React 18, TypeScript, Tailwind CSS, and Zustand for managing Minecraft mod profiles.

## Download

Download the Windows executable here:

https://www.mediafire.com/file/vdoxkdi7b26zneh/MCMod-Manager-0.1.0.exe/file

## Screenshots

### Dashboard

![Dashboard](docs/screenshots/dashboard.png)

### Profiles

![Profiles](docs/screenshots/profiles.png)

### Mod Browser

![Mod Browser](docs/screenshots/mods.png)

### Conflict Center

![Conflict Center](docs/screenshots/conflicts.png)

### Settings

![Settings](docs/screenshots/settings.png)

## Requirements

- Node 18+
- npm

## Development

```bash
npm install
npm run dev
```

## Creating A Profile

Open **Profiles**, click **New**, choose the Minecraft version, loader, loader version, and confirm the `mods` folder path. The app tries to detect the default `.minecraft` folder for your operating system.

## Installing Mods

Open **Mod Browser**, search through the real Modrinth API, adjust the loader and Minecraft version for the active profile, then click **Install**. The `.jar` file is downloaded into `profile.modsPath`.

## Reading The Conflict Center

The **Conflict Center** separates critical errors from warnings. The Compatibility Score shows the percentage of installed mods without detected conflicts. Items with automatic fixes can be handled individually or through **Fix All**.

## Local Modpack Scanning

For local modpacks, MCMod Manager scans `.jar` files and reads Fabric, Quilt, Forge, and NeoForge metadata when available. It uses that metadata to detect loader mismatches, Minecraft version mismatches, missing required dependencies, declared incompatibilities, duplicate mods, and corrupted `.jar` files.
