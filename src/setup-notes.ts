import * as vscode from 'vscode';
import * as path from 'path';

export default function setupNotes() {
	const msg = 'Welcome to VSNotes. To begin, choose a location to save your notes. Click Start to continue ->';

	vscode.window.showInformationMessage(msg, 'Start').then(async (value) => {
		if (value === 'Start') {
			try {
				const uris = await vscode.window.showOpenDialog({
					canSelectFiles: false,
					canSelectFolders: true,
					canSelectMany: false,
					openLabel: 'Select',
				});

				if (uris && uris.length > 0) {
					const noteFolder = vscode.workspace.getConfiguration('vsnotes');
					await noteFolder.update('defaultNotePath', path.normalize(uris[0].fsPath), true);
					vscode.window.showInformationMessage(
						'Note Path Saved. Edit the location by re-running setup or editing the path in VS Code Settings.'
					);
				}
			} catch (err) {
				vscode.window.showErrorMessage('Error occurred during setup.');
				console.error(err);
			}
		}
	});
}
