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

import { workspace, window, Uri } from 'vscode';
import klaw from 'klaw';
import path from 'path';
import { getDefaultNotePath } from './utils';

export function toggleIncludeHiddenFiles(): void {
	const config = workspace.getConfiguration('vsnotes');
	const currentValue = config.get<boolean>('includeHiddenFiles', false);
	config.update('includeHiddenFiles', !currentValue, true);
}

export default function () {
	const config = workspace.getConfiguration('vsnotes');
	const noteFolder = getDefaultNotePath();
	const listRecentLimit = config.get<number>('listRecentLimit') || 10;
	const ignorePatterns = config.get<string[]>('ignorePatterns') || [];
	const ignorePattern = new RegExp(ignorePatterns.map((pattern) => `(${pattern})`).join('|'));
	const noteFolderLen = noteFolder.length;
	let files: klaw.Item[] = [];

	klaw(noteFolder)
		.on('data', (item: klaw.Item) => {
			const relativePath = item.path.slice(noteFolder.length + 1);
			if (
				!ignorePattern.test(relativePath) &&
				!item.stats.isDirectory() &&
				(!path.basename(item.path).startsWith('.') || config.get<boolean>('includeHiddenFiles'))
			) {
				files.push(item);
			}
		})
		.on('error', (err: Error, item: klaw.Item) => {
			window.showErrorMessage(`Error occurred while scanning file: ${item.path}`);
			console.error('Error while walking notes folder: ', item, err);
		})
		.on('end', () => {
			files.sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

			const shortPaths = files.slice(0, listRecentLimit).map((file) => file.path.slice(noteFolderLen + 1));

			window.showQuickPick(shortPaths).then(
				(res) => {
					if (res) {
						window.showTextDocument(Uri.file(path.join(noteFolder, res))).then(
							(file) => console.log('Opening file', res),
							(err) => console.error(err)
						);
					}
				},
				(err) => console.error(err)
			);
		});
}
