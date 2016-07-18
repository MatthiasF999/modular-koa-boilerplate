import Koa from 'koa';
import Koarouter from 'koa-router';
import ModuleManager from 'modulemanager';
import Arangojs from 'arangojs';
import scServer from 'socketcluster-server';
import http from 'http';
import path from 'path';
import callsite from 'callsite';

function getDbUrl(conf) {
	if (conf.url.includes('https://')) {
		const url = conf.url.replace('https://', '');
		return `https://${conf.user}:${conf.password}@${url}:${conf.port}`;
	}
	if (conf.url.includes('http://')) {
		const url = conf.url.replace('http://', '');
		return `http://${conf.user}:${conf.password}@${url}:${conf.port}`;
	}
	return `${conf.user}:${conf.password}@${conf.url}:${conf.port}`;
}

export default class Server {
	constructor(options) {
		const stack = callsite();

		this.db = new Arangojs({
			url: getDbUrl(options.dbConfig),
			databaseName: options.dbConfig.databaseName,
		});

		this.logging = options.logging || false;

		this.router = new Koarouter();

		this.app = new Koa()
			.use(this.router.routes())
			.use(this.router.allowedMethods());

		const httpServer = http.createServer(this.app.callback());

		this.scServer = scServer.attach(httpServer);

		this.manager = new Map();

		this.requester = path.dirname(stack[1].getFileName());

		if (!options.test) httpServer.listen(options.port);
		if (this.logging) {
			console.info(`server running on port ${options.port}`);
		}

		this.scServer.on('connection', (socket) => {
			socket.emmit('connected', 'you are connected');
		});
	}

	createManager(name, fold, opt) {
		const folder = fold || name;
		const options = opt || {};
		const functions = [
			'install',
			'activate',
			'update',
			'deactivate',
			'uninstall',
		];
		options.app = this.app;
		options.scServer = this.scServer;
		options.db = this.db;
		options.router = this.router;
		options.manager = this.manager;
		options.logging = true;
		options.folder = path.normalize(`${this.requester}/${folder}`);

		const manager = new ModuleManager({
			folder,
			passCaller: false,
			options,
		});

		this.manager.set(name, manager);

		this.scServer.on('connection', (socket) => {
			functions.forEach((fn) => {
				socket.on(`${name}.${fn}`, (module) => {
					manager[fn](module).then(() => {
						socket.emit('module', `${name}.${module}.${fn} succeeded`);
					});
				});
			});
		});

		if (this.logging) {
			console.info(`${name}-manager loaded`);
		}
	}
}
