import t, { type Test } from "tap";
import * as u8 from "uint8arrays";

import { IteratorStreamSearch } from "./iterator.js";
import { MATCH } from "./search.js";

t.test("iterator error handling", async (t: Test): Promise<void> => {
	t.test(
		"should handle iterator with throw method",
		async (t: Test): Promise<void> => {
			const error = new Error("test error");
			let throwCalled = false;

			async function* gen() {
				yield u8.fromString("hello");
				throw error;
			}

			const iter = gen();
			const originalThrow = iter.throw;
			iter.throw = async function (e) {
				throwCalled = true;
				return originalThrow?.call(this, e) || { done: true, value: undefined };
			};

			const search = new IteratorStreamSearch("world", iter);

			try {
				for await (const _ of search) {
					// consume iterator
				}
				t.fail("should have thrown");
			} catch (e) {
				t.equal(e, error);
				t.ok(throwCalled, "throw method should be called");
			}

			t.end();
		},
	);

	t.test(
		"should handle iterator throw returning done result and break",
		async (t: Test): Promise<void> => {
			const error = new Error("test error");
			let throwWasCalled = false;

			async function* gen() {
				yield u8.fromString("hello");
				throw error;
			}

			const iter = gen();
			iter.throw = async function () {
				throwWasCalled = true;
				return { done: true, value: undefined };
			};

			const search = new IteratorStreamSearch("world", iter);

			const results: Uint8Array[] = [];
			for await (const token of search) {
				if (token !== MATCH) {
					results.push(token);
				}
			}

			t.ok(throwWasCalled, "throw method should be called");
			t.equal(results.length, 1);
			t.equal(u8.toString(results[0]), "hello");

			t.end();
		},
	);

	t.test(
		"should handle iterator throw returning not done and continue",
		async (t: Test): Promise<void> => {
			const error = new Error("test error");
			let throwWasCalled = false;

			async function* gen() {
				yield u8.fromString("hello");
				throw error;
			}

			const iter = gen();
			iter.throw = async function () {
				throwWasCalled = true;
				return { done: false, value: u8.fromString("recovered") };
			};

			const search = new IteratorStreamSearch("world", iter);

			const results: Uint8Array[] = [];
			for await (const token of search) {
				if (token !== MATCH) {
					results.push(token);
				}
			}

			t.ok(throwWasCalled, "throw method should be called");
			t.ok(results.length >= 2, "should have at least 2 results");
			t.equal(u8.toString(results[0]), "hello");
			t.equal(u8.toString(results[1]), "recovered");

			t.end();
		},
	);

	t.test(
		"should rethrow error when iterator has no throw method",
		async (t: Test): Promise<void> => {
			const error = new Error("test error");
			let errorThrown = false;

			const asyncIterable = {
				[Symbol.asyncIterator]() {
					let count = 0;
					return {
						async next() {
							if (count === 0) {
								count++;
								return { done: false, value: u8.fromString("hello") };
							}
							throw error;
						},
					};
				},
			};

			const search = new IteratorStreamSearch("world", asyncIterable);

			try {
				for await (const _ of search) {
					// consume iterator
				}
				t.fail("should have thrown");
			} catch (e) {
				errorThrown = true;
				t.equal(e, error);
			}

			t.ok(errorThrown, "error should be thrown");

			t.end();
		},
	);

	t.end();
});
