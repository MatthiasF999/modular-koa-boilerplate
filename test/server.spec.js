/* eslint-disable no-unused-expressions */
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import mochaAsync from './mocha-async';
import Server from '../src/server';
import scClient from 'socketcluster-client';

const expect = chai.expect;

chai.use(sinonChai);

/**
 * @test {Server}
 */
describe('Server', () => {
	let server;
	const test = sinon.stub();
	const dbConfig = {
		url: 'http://url.test',
		user: 'user',
		password: 'password',
		port: 3000,
		databaseName: 'test',
	};
	const socketConfig = {
		hostname: 'localhost',
		port: 3000,
	};

	beforeEach(() => {
		server = new Server({ dbConfig, port: 3000, test: true });
	});
	afterEach(() => {
		test.reset();
	});

	/**
	 * @test {Server#constructor}
	 */
	describe('Server#constructor', () => {
		/**
		 * @test {Server#constructor}
		 */
		it('Server#constructor creates database url', () => {
			// eslint-disable-next-line no-underscore-dangle
			const serverConfig = server.db._connection.config;
			expect(serverConfig.url)
				.to.be.equal('http://user:password@url.test:3000');
			expect(serverConfig.databaseName)
				.to.be.equal('test');
		});

		/**
		 * @test {Server#constructor}
		 */
		it('Server#constructor creates sockets', () => {
			// eslint-disable-next-line no-underscore-dangle
			const socket = scClient.connect(socketConfig);

			socket.on('connected', (message) => {
				expect(message).to.be.equal('you are connected');
			});
		});
	});

	/**
	 * @test {Server#createManager}
	 */
	describe('Server#createManager', () => {
		/**
		 * @test {Server#createManager}
		 */
		it('Server#createManager creates manager', () => {
			// eslint-disable-next-line no-underscore-dangle
			server.createManager('coreTest', '../test/coretest');
			const manager = server.manager.get('coreTest');

			expect(manager).to.exist;
			expect(manager.options.app).to.be.equal(server.app);
		});

		/**
		 * @test {Server#createManager}
		 */
		it('Server#createManager allows functions to pass',
			mochaAsync(async() => {
				// eslint-disable-next-line no-underscore-dangle
				server.createManager('coreTest', '../test/coretest', { test });
				const manager = server.manager.get('coreTest');

				await manager.activate('module1');

				expect(manager.moduleMap.has('module1')).to.be.true;
				expect(test).to.have.been.calledWith('activate');
			})
		);

		/**
		 * @test {Server#createManager}
		 */
		it('Server#createManager uses sockets', () => {
			// eslint-disable-next-line no-underscore-dangle
			server.createManager('coreTest', '../test/coretest', { test });
			const manager = server.manager.get('coreTest');
			const socket = scClient.connect(socketConfig);

			socket.emit('coreTest.install', 'module1');

			socket.on('module', (message) => {
				expect(message)
					.to.be.equal('coreTest.module1.activate succeeded');
				expect(manager.moduleMap.has('module1')).to.be.true;
				expect(test).to.have.been.calledWith('activate');
			});
		});
	});
});
