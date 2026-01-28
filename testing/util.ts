export const BAD_INPUT_DIR = "erroneous_input";

export function cmp(s1: string, s2: string) {
	if (s1.length !== s2.length) {
		return false;
	}

	for (let i = 0; i < s1.length; i++) {
		if (s1.charCodeAt(i) !== s2.charCodeAt(i)) {
			return false;
		}
	}

	return true;
}
