import ColorGrid from '@/components/ColorGrid'

export default function Home() {
  return (
    <main className="p-6 w-[60vw] mx-auto">
      <h1 className="no-print text-2xl font-semibold mb-4">Kolorowanki</h1>
      <ColorGrid />
    </main>
  )
}
