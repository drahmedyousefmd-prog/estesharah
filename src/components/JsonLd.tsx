/**
 * Renders a JSON-LD structured-data block. `</` is escaped so a literal
 * `</script>` inside the data can never break out of the script element.
 */
export function JsonLd<T extends Record<string, unknown>>({ data }: { data: T }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}