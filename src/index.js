const dbconfig = require('./dbconfig.json');
import Server from './server';

const server = new Server({
	dbconfig,
	port: 3000,
});

server.createManager('core', './core');
server.createManager('plugins', './plugins');
