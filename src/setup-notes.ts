/**
 * MIT License
 *
 * Copyright (c) 2024 zax4r0
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

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
