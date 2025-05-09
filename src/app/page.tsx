import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8 md:p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">Stone Mockup Generator</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="mb-6 text-lg">
            Create professional stone fabrication mockups with ease. This tool allows you to:
          </p>
          
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Generate accurate visual representations of stone pieces</li>
            <li>Specify dimensions, polished edges, material type, and thickness</li>
            <li>Export mockups as PNG images or PDF documents</li>
            <li>Create multiple pieces and compile them into a single document</li>
          </ul>
          
          <div className="flex justify-center mt-8">
            <Link 
              href="/generator" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
            >
              Start Creating Mockups
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
