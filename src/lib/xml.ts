/** 最小化的 XML 转义：用于本地内容生成 sitemap / RSS，避免未转义字符破坏文档。 */
export function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
