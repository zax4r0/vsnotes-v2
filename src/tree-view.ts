import * as vscode from 'vscode';
import fs from 'fs';
import path from 'path';
import klaw from 'klaw';
import matter from 'gray-matter';
import { getDefaultNotePath } from './utils';

class VSNotesTreeView implements vscode.TreeDataProvider<TreeNode> {
	private _onDidChangeTreeData: vscode.EventEmitter<TreeNode | undefined> = new vscode.EventEmitter<
		TreeNode | undefined
	>();
	readonly onDidChangeTreeData: vscode.Event<TreeNode | undefined> = this._onDidChangeTreeData.event;

	private baseDir: string;
	private ignorePattern: RegExp;
	private hideTags: boolean;
	private hideFiles: boolean;

	constructor() {
		const config = vscode.workspace.getConfiguration('vsnotes');
		this.baseDir = getDefaultNotePath();
		this.ignorePattern = new RegExp(
			config
				.get('ignorePatterns')
				.map((pattern: string) => `(${pattern})`)
				.join('|')
		);
		this.hideTags = config.get('treeviewHideTags');
		this.hideFiles = config.get('treeviewHideFiles');
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: TreeNode): vscode.TreeItem {
		return element.treeItem;
	}

	async getChildren(element?: TreeNode): Promise<TreeNode[]> {
		if (!element) {
			const treeview: TreeNode[] = [];
			if (!this.hideFiles) {
				treeview.push(new TreeNode('Files', vscode.TreeItemCollapsibleState.Expanded, 'file-directory.svg'));
			}
			if (!this.hideTags) {
				treeview.push(new TreeNode('Tags', vscode.TreeItemCollapsibleState.Expanded, 'tag.svg'));
			}
			return treeview;
		}

		switch (element.type) {
			case 'rootTag':
				return this.getTags();
			case 'tag':
				return element.files.map(
					(file) => new TreeNode(file, vscode.TreeItemCollapsibleState.None, 'file.svg')
				);
			case 'rootFile':
				return this.getDirectoryContents(this.baseDir);
			case 'file':
				return this.getDirectoryContents(element.path);
			default:
				return [];
		}
	}

	private async getDirectoryContents(filePath: string): Promise<TreeNode[]> {
		const files = await fs.readdir(filePath);
		const items: TreeNode[] = [];
		for (const file of files) {
			if (!this.ignorePattern.test(file)) {
				const stats = await fs.stat(path.join(filePath, file));
				items.push(
					new TreeNode(
						file,
						stats.isDirectory()
							? vscode.TreeItemCollapsibleState.Collapsed
							: vscode.TreeItemCollapsibleState.None,
						'file.svg',
						filePath
					)
				);
			}
		}
		return items;
	}

	private async getTags(): Promise<TreeNode[]> {
		const files: Promise<{ path: string; contents: Buffer; payload: TreeNode }>[] = [];

		klaw(this.baseDir)
			.on('data', (item) => {
				files.push(
					new Promise((resolve, reject) => {
						const fileName = path.basename(item.path);
						if (!item.stats.isDirectory() && !this.ignorePattern.test(fileName)) {
							fs.readFile(item.path)
								.then((contents) => {
									resolve({
										path: item.path,
										contents: contents,
										payload: new TreeNode(
											fileName,
											vscode.TreeItemCollapsibleState.None,
											'file.svg',
											item.path
										),
									});
								})
								.catch((err) => {
									console.error(err);
									resolve();
								});
						} else {
							resolve();
						}
					})
				);
			})
			.on('error', (err, item) => {
				console.error('Error while walking notes folder for tags: ', item, err);
			});

		const filesResult = await Promise.all(files);
		const tagIndex: { [tag: string]: TreeNode[] } = {};
		filesResult.forEach((file) => {
			if (file) {
				const parsedFrontMatter = this.parseFrontMatter(file);
				if (parsedFrontMatter && 'tags' in parsedFrontMatter.data && parsedFrontMatter.data.tags) {
					for (const tag of parsedFrontMatter.data.tags) {
						if (tag in tagIndex) {
							tagIndex[tag].push(file.payload);
						} else {
							tagIndex[tag] = [file.payload];
						}
					}
				}
			}
		});

		const tags: TreeNode[] = [];
		Object.keys(tagIndex)
			.sort()
			.forEach((tag) => {
				tags.push(
					new TreeNode(tag, vscode.TreeItemCollapsibleState.Collapsed, 'tag.svg', undefined, tagIndex[tag])
				);
			});
		return tags;
	}

	private parseFrontMatter(file: { contents: Buffer }): matter.GrayMatterFile<string> | null {
		try {
			const parsedFrontMatter = matter(file.contents.toString());
			if (!(parsedFrontMatter.data instanceof Object)) {
				console.error('YAML front-matter is not an object');
				return null;
			}
			return parsedFrontMatter;
		} catch (e) {
			console.error(e);
			return null;
		}
	}
}

class TreeNode {
	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly iconPath: string,
		public readonly path?: string,
		public readonly files: TreeNode[] = []
	) {}

	get type(): string {
		if (this.path) {
			return fs.statSync(this.path).isDirectory() ? 'file' : 'tag';
		}
		return this.label === 'Tags' ? 'rootTag' : 'rootFile';
	}

	get treeItem(): vscode.TreeItem {
		const isDir = this.path ? fs.statSync(this.path).isDirectory() : false;
		const state = isDir ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None;
		const treeItem = new vscode.TreeItem(this.label, state);
		treeItem.iconPath = {
			light: path.join(__filename, '..', '..', 'media', 'light', this.iconPath),
			dark: path.join(__filename, '..', '..', 'media', 'dark', this.iconPath),
		};
		if (!isDir) {
			treeItem.command = {
				command: 'vscode.open',
				title: '',
				arguments: [vscode.Uri.file(this.path)],
			};
		}
		return treeItem;
	}
}

export default VSNotesTreeView;
