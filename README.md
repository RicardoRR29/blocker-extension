# Focus Blocker

Chrome extension that blocks distracting sites and helps maintain focus.

## Features

- Site blocking by keyword using the `declarativeNetRequest` API.
- Settings page to add or remove blocked sites.
- Block page with daily statistics and motivational quotes.
- Data stored locally using `chrome.storage`.

## Installation

1. Download or clone this repository.
2. In Chrome, go to `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the project folder.

## Usage

- To block a site, open the extension options page and add the desired address.
- When attempting to access a blocked site, the extension redirects to a warning page with statistics and motivational messages.

## Project Structure

- `manifest.json`: extension definitions.
- `background.js`: dynamic rule management.
- `options/`: interface for configuring blocked sites.
- `blocked/`: page displayed when a site is blocked.

## Contributions

Feel free to open issues and pull requests with improvements or fixes.
