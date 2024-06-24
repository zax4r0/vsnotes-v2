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
