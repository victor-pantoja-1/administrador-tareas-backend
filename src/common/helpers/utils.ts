export function getImagesInEditor(
	value: string,
): { tag: string; base64: string }[] {
	const matchs = value.match(/<img[^>]+>/g) || [];
	const files: any[] = [];
	for (const m of matchs) {
		const base64String = m.match(/base64,([A-Za-z0-9+\\/=]+)/);
		files.push({
			tag: m,
			base64: base64String[1],
		});
	}
	return files;
}
