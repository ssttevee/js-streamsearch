import fs from "fs";
import path from "path";

import { ReadableStreamSearch } from "../src";
import { BAD_INPUT_DIR, cmp, makeStream } from "./util";

function randomString(min: number, max: number): string {
	return Array.from(
		{ length: min + Math.floor(Math.random() * (max - min)) },
		() => String.fromCharCode(Math.floor(Math.random() * 256)),
	).join("");
}

function randomlySplit(input: string): string[] {
	const cuts = [
		...new Set(
			Array.from({ length: Math.floor(Math.random() * input.length) }, () =>
				Math.floor(Math.random() * input.length),
			).filter((n) => n > 0),
		),
	].sort((a, b) => a - b);

	if (!cuts.length) {
		return [input];
	}

	const output: string[] = [input.slice(0, cuts[0])];
	for (let i = 0; i < cuts.length - 1; i++) {
		const a = cuts[i];
		const b = cuts[i + 1];

		output.push(input.slice(a, b));
	}

	output.push(input.slice(cuts[cuts.length - 1]));

	return output;
}

function randomlySplice(haystack: string, needle: string): string {
	const split = randomlySplit(haystack);
	return Array.from({ length: split.length * 2 - 1 }, (_, i) =>
		i % 2 === 0 ? split[i / 2] : needle,
	).join("");
}

(async () => {
	while (true) {
		const needle = randomString(1, 1 << 8);
		const haystack = randomlySplice(randomString(0, 1 << 8), needle);
		const chunks = randomlySplit(haystack);
		const expected = haystack.split(needle);

		const search = new ReadableStreamSearch(needle, makeStream(chunks));
		const result = await search.allStrings();

		if (
			result.length !== expected.length ||
			result.some((v, i) => !cmp(v, expected[i]))
		) {
			fs.mkdirSync(BAD_INPUT_DIR, { recursive: true });
			fs.writeFileSync(
				path.join(BAD_INPUT_DIR, `${Date.now()}.json`),
				JSON.stringify({ needle, chunks }),
			);
			process.stdout.write("!");
		} else {
			process.stdout.write(".");
		}
	}
})().catch(console.error);
