import t, { type Test } from "tap";
import * as u8 from "uint8arrays";

import { QueueableStreamSearch } from "./queueable.js";
import { MATCH } from "./search.js";

t.test("queueable error handling", async (t: Test): Promise<void> => {
	t.test(
		"should throw error when push is called after close",
		async (t: Test): Promise<void> => {
			const search = new QueueableStreamSearch("test");
			search.close();

			t.throws(() => search.push(u8.fromString("data")), {
				message: "cannot call push after close",
			});

			t.end();
		},
	);

	t.test(
		"should throw error when close is called twice",
		async (t: Test): Promise<void> => {
			const search = new QueueableStreamSearch("test");
			search.close();

			t.throws(() => search.close(), { message: "close was already called" });

			t.end();
		},
	);

	t.end();
});

t.test("queueable async behavior", async (t: Test): Promise<void> => {
	t.test(
		"should handle push notification while iterating",
		async (t: Test): Promise<void> => {
			const search = new QueueableStreamSearch("||");
			const results: string[] = [];

			const iterPromise = (async () => {
				for await (const token of search) {
					if (token !== MATCH) {
						results.push(u8.toString(token));
					}
				}
			})();

			await new Promise((resolve) => setTimeout(resolve, 10));
			search.push(u8.fromString("hello"));

			await new Promise((resolve) => setTimeout(resolve, 10));
			search.push(u8.fromString("||"));

			await new Promise((resolve) => setTimeout(resolve, 10));
			search.push(u8.fromString("world"));

			await new Promise((resolve) => setTimeout(resolve, 10));
			search.close();

			await iterPromise;

			t.same(results, ["hello", "world"]);

			t.end();
		},
	);

	t.test(
		"should handle close notification while waiting",
		async (t: Test): Promise<void> => {
			const search = new QueueableStreamSearch("test");
			const results: string[] = [];

			const iterPromise = (async () => {
				for await (const token of search) {
					if (token !== MATCH) {
						results.push(u8.toString(token));
					}
				}
			})();

			await new Promise((resolve) => setTimeout(resolve, 10));
			search.close();

			await iterPromise;

			t.same(results, []);

			t.end();
		},
	);

	t.test(
		"should yield tail when it has length",
		async (t: Test): Promise<void> => {
			const search = new QueueableStreamSearch("test");
			const results: string[] = [];

			const iterPromise = (async () => {
				for await (const token of search) {
					if (token !== MATCH) {
						results.push(u8.toString(token));
					}
				}
			})();

			await new Promise((resolve) => setTimeout(resolve, 10));
			search.push(u8.fromString("hello te"));

			await new Promise((resolve) => setTimeout(resolve, 10));
			search.close();

			await iterPromise;

			t.same(results, ["hello ", "te"]);

			t.end();
		},
	);

	t.end();
});
