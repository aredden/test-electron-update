/** @format */

import { BrowserWindow, IpcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import getLogger from './Logger';

let LOGGER = getLogger('AutoUpdater');

export default class AppUpdater {
	constructor(browserWindow: BrowserWindow, ipc: IpcMain) {
		const LOGGER = getLogger('AppUpdater');
		autoUpdater.allowPrerelease = true;
		LOGGER.info(autoUpdater.getFeedURL());
		autoUpdater
			.checkForUpdatesAndNotify({
				title: 'G14ControlV2',
				body: 'New updates available!',
			})
			.then((val) => {
				LOGGER.info('gotinfo: ' + JSON.stringify(val.updateInfo, null, 2));
			});
		autoUpdater.on('update-available', () => {
			browserWindow.webContents.send('updateAvailable');
		});
		autoUpdater.on('update-downloaded', () => {
			browserWindow.webContents.send('updateDownloaded');
		});
		ipc.on('exitAndUpdate', () => {
			autoUpdater.quitAndInstall(false, true);
		});
	}
}
