export function stringToArray(s: string): Uint8Array {
    return new Uint8Array(s.split('').map((c) => c.charCodeAt(0)))
}

export function arrayToString(a: Uint8Array): string {
    return Array.from(a).map((c) => String.fromCharCode(c)).join('');
}
