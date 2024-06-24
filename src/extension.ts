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

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import setupNotes from './setup-notes';
import listNotes from './list-notes';
import VSNotesTreeView, { TreeNode } from './tree-view';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const treeViewProvider = new VSNotesTreeView();
	vscode.window.registerTreeDataProvider('vsnotes', treeViewProvider);
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vsnotes" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('vsnotes.setupNotes', setupNotes);
	context.subscriptions.push(disposable);

	// Refresh View
	vscode.commands.registerCommand('vsnotes.refreshVSNotesView', () => treeViewProvider.refresh());

	vscode.commands.registerCommand('vsnotes.renameNote', (node: TreeNode) => treeViewProvider.renameNode(node));
	vscode.commands.registerCommand('vsnotes.deleteNote', (node: TreeNode) => treeViewProvider.deleteNode(node));

	const listNotesDisposable = vscode.commands.registerCommand('vsnotes.listNotes', listNotes);
	context.subscriptions.push(listNotesDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
