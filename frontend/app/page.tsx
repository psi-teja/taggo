// app/page.tsx
import Link from 'next/link';

const tools = [
  {
    title: 'Invoice Parsing',
    description: 'Extract fields from invoice documents.',
    href: '/invoice-parsing',
  },
  {
    title: 'Object Detection',
    description: 'Draw bounding boxes over objects in images.',
    href: '/object-detection',
  },
  {
    title: 'Document Classification',
    description: 'Label documents based on their type.',
    href: '/document-classification',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen px-6 py-12 bg-gray-50">
      <h1 className="text-3xl font-bold mb-8">Taggo</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <Link key={tool.title} href={tool.href} passHref>
            <div className="p-6 bg-white rounded shadow hover:shadow-lg transition cursor-pointer border border-gray-200">
              <h2 className="text-xl font-semibold mb-2">{tool.title}</h2>
              <p className="text-gray-600">{tool.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
