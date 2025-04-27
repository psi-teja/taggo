"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from './components/Header';
import Logo from './components/Logo';
import withAuth from './components/withAuth';
import AccountDetails from './components/AccountDetails';
import { FaFileInvoice, FaObjectGroup, FaFileAlt, FaTags, FaImage } from 'react-icons/fa';

const tools = [
  {
    title: 'Invoice Parsing',
    description: 'Extract fields from invoice documents.',
    href: '/invoice-parsing',
    icon: <FaFileInvoice />,
  },
  {
    title: 'Object Detection',
    description: 'Draw bounding boxes over objects in images.',
    href: '/object-detection',
    icon: <FaObjectGroup />,
  },
  {
    title: 'Document Classification',
    description: 'Label documents based on their type.',
    href: '/document-classification',
    icon: <FaFileAlt />,
  },
  {
    title: 'Named Entity Recognition',
    description: 'Identify and classify named entities in text.',
    href: '/name-entity-recognition',
    icon: <FaTags />,
  },
  {
    title: 'Image Segmentation',
    description: 'Segment different parts of an image.',
    href: '/image-segmentation',
    icon: <FaImage />,
  },
];

function Home() {

  const router = useRouter();

  const [userData, setUserData] = useState(null);
  useEffect(() => {
    const storedUserData = localStorage.getItem("userData");
    if (storedUserData) {
      const parsedUserData = JSON.parse(storedUserData);
      setUserData(parsedUserData);
    } else {
      console.log("No user data found in local storage.");
      const currentPath = window.location.pathname + window.location.search;
      router.replace(`/login?next=${encodeURIComponent(currentPath)}`);
    }
  }, []);


  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50">
      <Header>
        <Logo />
        <AccountDetails userData={userData}/>
      </Header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-10 py-20">
        {tools.map((tool, index) => (
          <Link key={tool.title} href={tool.href} passHref>
            <div
              className={`
                p-6 bg-white rounded-lg shadow-md 
                hover:shadow-xl hover:scale-105 transition-transform duration-300 cursor-pointer border border-gray-200
                animate-slideUp opacity-0
              `}
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
            >
              <div className="flex items-center justify-center text-4xl text-purple-500 mb-4">
                {tool.icon}
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">{tool.title}</h2>
              <p className="text-gray-600 text-center">{tool.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Add Tailwind animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 1s ease-in-out forwards;
        }
        .animate-slideUp {
          animation: slideUp 0.8s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
}

export default withAuth(Home);
