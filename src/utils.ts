import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as vscode from 'vscode';

export function getDefaultNotePath(): string {
	const config = vscode.workspace.getConfiguration('vsnotes');
	let notePath = config.get<string>('defaultNotePath');

	if (!notePath) {
		switch (os.platform()) {
			case 'win32':
				notePath = path.join(os.homedir(), 'Documents', 'Test');
				break;
			case 'darwin':
				notePath = path.join(os.homedir(), 'Documents', 'Test');
				break;
			case 'linux':
				notePath = path.join(os.homedir(), 'Documents', 'Test');
				break;
			default:
				notePath = path.join(os.homedir(), 'Documents', 'Test');
		}

		config.update('defaultNotePath', notePath, vscode.ConfigurationTarget.Global);
	}

	if (!fs.existsSync(notePath)) {
		fs.mkdirSync(notePath, { recursive: true });
	}

	return notePath;
}
