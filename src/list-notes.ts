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
