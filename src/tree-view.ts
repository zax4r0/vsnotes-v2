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
import fs from 'fs-extra';
import path from 'path';
import klaw from 'klaw';
import matter from 'gray-matter';
import { getDefaultNotePath } from './utils';

export interface TreeNode {
	type: 'rootTag' | 'tag' | 'rootFile' | 'file';
	tag?: string;
	files?: TreeNode[];
	file?: string;
	path?: string;
	stats?: fs.Stats;
}

class VSNotesTreeView {
	private baseDir: string;
	private ignorePattern: RegExp;
	private hideTags: boolean;
	private hideFiles: boolean;
	private _onDidChangeTreeData: vscode.EventEmitter<void>;
	public onDidChangeTreeData: vscode.Event<void>;

	constructor() {
		const config = vscode.workspace.getConfiguration('vsnotes');
		this.baseDir = getDefaultNotePath();
		this.ignorePattern = new RegExp(
			(config.get<string[]>('ignorePatterns') || []).map((pattern) => `(${pattern})`).join('|')
		);
		this.hideTags = config.get<boolean>('treeviewHideTags') || false;
		this.hideFiles = config.get<boolean>('treeviewHideFiles') || false;
		this._onDidChangeTreeData = new vscode.EventEmitter();
		this.onDidChangeTreeData = this._onDidChangeTreeData.event;
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	async getChildren(node?: TreeNode): Promise<TreeNode[] | undefined> {
		if (node) {
			vscode.window.showInformationMessage(`Node type: ${node.type}`);
			switch (node.type) {
				case 'rootTag':
					return this._getTags();
				case 'tag':
					return node.files;
				case 'rootFile':
					return this._getDirectoryContents(this.baseDir);
				case 'file':
					return this._getDirectoryContents(node.path!);
			}
		} else {
			const treeview: TreeNode[] = [];
			if (!this.hideFiles) {
				treeview.push({ type: 'rootFile' });
			}
			if (!this.hideTags) {
				treeview.push({ type: 'rootTag' });
			}
			return treeview;
		}
	}

	getTreeItem(node: TreeNode): vscode.TreeItem {
		switch (node.type) {
			case 'rootTag': {
				const item = new vscode.TreeItem('Tags', vscode.TreeItemCollapsibleState.Expanded);
				item.contextValue = node.type;
				item.iconPath = {
					light: path.join(__filename, '..', '..', 'media', 'light', 'tag.svg'),
					dark: path.join(__filename, '..', '..', 'media', 'dark', 'tag.svg'),
				};
				return item;
			}
			case 'rootFile': {
				const item = new vscode.TreeItem('Files', vscode.TreeItemCollapsibleState.Expanded);
				item.contextValue = node.type;
				item.iconPath = {
					light: path.join(__filename, '..', '..', 'media', 'light', 'file-directory.svg'),
					dark: path.join(__filename, '..', '..', 'media', 'dark', 'file-directory.svg'),
				};
				return item;
			}
			case 'tag': {
				const item = new vscode.TreeItem(node.tag!, vscode.TreeItemCollapsibleState.Collapsed);
				item.contextValue = node.type;
				item.iconPath = {
					light: path.join(__filename, '..', '..', 'media', 'light', 'tag.svg'),
					dark: path.join(__filename, '..', '..', 'media', 'dark', 'tag.svg'),
				};
				return item;
			}
			case 'file': {
				const isDir = node.stats!.isDirectory();
				const state = isDir ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None;
				const item = new vscode.TreeItem(node.file!, state);
				item.contextValue = node.type;
				if (isDir) {
					item.iconPath = {
						light: path.join(__filename, '..', '..', 'media', 'light', 'file-directory.svg'),
						dark: path.join(__filename, '..', '..', 'media', 'dark', 'file-directory.svg'),
					};
				} else {
					item.command = {
						command: 'vscode.open',
						title: '',
						arguments: [vscode.Uri.file(node.path!)],
					};
					item.iconPath = {
						light: path.join(__filename, '..', '..', 'media', 'light', 'file.svg'),
						dark: path.join(__filename, '..', '..', 'media', 'dark', 'file.svg'),
					};
				}
				return item;
			}
		}
	}

	async renameNode(node: TreeNode): Promise<void> {
		const newName = await vscode.window.showInputBox({
			placeHolder: 'Enter the new name',
			value: node.file,
		});
		if (newName) {
			const newPath = path.join(path.dirname(node.path!), newName);
			await fs.rename(node.path!, newPath);
			this.refresh();
		}
	}

	async deleteNode(node: TreeNode): Promise<void> {
		const confirmation = await vscode.window.showWarningMessage(
			`Are you sure you want to delete ${node.file}?`,
			{ modal: true },
			'Yes'
		);
		if (confirmation === 'Yes') {
			await fs.remove(node.path!);
			this.refresh();
		}
	}

	private async _getDirectoryContents(filePath: string): Promise<TreeNode[]> {
		try {
			const files = await fs.readdir(filePath);
			const items = await Promise.all(
				files
					// .filter((file) => !this.ignorePattern.test(file))
					.map(async (file) => {
						const filePathFull = path.join(filePath, file);
						const stats = await fs.stat(filePathFull);
						return { type: 'file', file, path: filePathFull, stats };
					})
			);
			return items as TreeNode[];
		} catch (err) {
			console.error('Error reading directory contents:', filePath, err);
			return [];
		}
	}

	private async _getTags(): Promise<TreeNode[]> {
		const files: Promise<{ path: string; contents: string; payload: TreeNode } | undefined>[] = [];
		return new Promise((resolve, reject) => {
			klaw(this.baseDir)
				.on('data', (item) => {
					const fileName = path.basename(item.path);
					if (!item.stats.isDirectory() && !this.ignorePattern.test(fileName)) {
						files.push(
							fs
								.readFile(item.path, 'utf8')
								.then((contents) => ({
									path: item.path,
									contents,
									payload: {
										type: 'file' as 'file', // Explicitly setting the type
										file: fileName,
										path: item.path,
										stats: item.stats,
									} as TreeNode, // Casting to TreeNode
								}))
								.catch((err) => {
									console.error('Error reading file:', item.path, err);
									return undefined;
								})
						);
					}
				})
				.on('error', (err: any, item: klaw.Item) => {
					reject(err);
					console.error('Error while walking notes folder for tags: ', item.path, err);
				})
				.on('end', async () => {
					const resolvedFiles = (await Promise.all(files)).filter(Boolean) as {
						path: string;
						contents: string;
						payload: TreeNode;
					}[];
					const tagIndex: { [tag: string]: TreeNode[] } = {};

					for (const file of resolvedFiles) {
						const parsedFrontMatter = this._parseFrontMatter(file);
						if (parsedFrontMatter && parsedFrontMatter.data.tags) {
							for (const tag of parsedFrontMatter.data.tags) {
								if (tagIndex[tag]) {
									tagIndex[tag].push(file.payload);
								} else {
									tagIndex[tag] = [file.payload];
								}
							}
						}
					}

					const tags: TreeNode[] = Object.keys(tagIndex).map((tag) => ({
						type: 'tag',
						tag,
						files: tagIndex[tag],
					}));

					tags.sort((a, b) => (a.tag! > b.tag! ? 1 : b.tag! > a.tag! ? -1 : 0));
					resolve(tags);
				});
		});
	}

	private _parseFrontMatter(file: { path: string; contents: string }) {
		try {
			const parsed = matter(file.contents);
			if (typeof parsed.data !== 'object') {
				console.error('YAML front-matter is not an object: ', file.path);
				return null;
			}
			return parsed;
		} catch (e) {
			console.error('Error parsing front matter:', file.path, e);
			return null;
		}
	}
}

export default VSNotesTreeView;
