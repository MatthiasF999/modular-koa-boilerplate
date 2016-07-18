const mochaAsync = (fn) => async(done) => {
	try {
		await fn();
		done();
	} catch (err) {
		done(err);
	}
};

export default mochaAsync;
