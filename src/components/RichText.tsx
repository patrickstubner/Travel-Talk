export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\[[^[\]]+\])/)
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('[') && part.endsWith(']')) {
          return (
            <mark key={`${part}-${index}`} className="slot">
              {part}
            </mark>
          )
        }
        return <span key={`${part}-${index}`}>{part}</span>
      })}
    </>
  )
}
