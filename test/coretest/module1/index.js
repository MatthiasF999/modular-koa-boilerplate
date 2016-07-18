import { Module } from 'modulemanager';

export default class extends Module {
	async install() {
		this.test('install');
	}

	async uninstall() {
		this.test('uninstall');
	}

	async update() {
		this.test('update');
	}

	async activate() {
		this.test('activate');
	}

	async deactivate() {
		this.test('deactivate');
	}
}
