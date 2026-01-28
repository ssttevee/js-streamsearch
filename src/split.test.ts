import t, { type Test } from "tap";
import * as u8 from "uint8arrays";

import { split } from "./split.js";

t.test("split with single Uint8Array", (t: Test): void => {
	const text = "hello world foo bar";
	const input = u8.fromString(text);

	t.same(
		split(input, " ").map((chunk) => u8.toString(chunk)),
		text.split(" "),
	);

	t.end();
});

t.test("split with array of Uint8Arrays", (t: Test): void => {
	const parts = ["hello ", "world ", "foo ", "bar"];
	const input = parts.map((part) => u8.fromString(part));

	const result = split(input, " ").map((chunk) => u8.toString(chunk));

	t.same(result, ["hello", "world", "foo", "bar"]);

	t.end();
});

t.test("split with string needle", (t: Test): void => {
	const text = "one||two||three";
	const input = u8.fromString(text);

	t.same(
		split(input, "||").map((chunk) => u8.toString(chunk)),
		text.split("||"),
	);

	t.end();
});

t.test("split with Uint8Array needle", (t: Test): void => {
	const text = "one||two||three";
	const input = u8.fromString(text);
	const needle = u8.fromString("||");

	t.same(
		split(input, needle).map((chunk) => u8.toString(chunk)),
		text.split("||"),
	);

	t.end();
});
