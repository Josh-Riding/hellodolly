import { Caveat } from "next/font/google"

// Handwriting font only loads in the memories section.
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat" })

export default function MemoriesLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${caveat.variable} flex flex-1 flex-col bg-desk`}>{children}</div>
}
