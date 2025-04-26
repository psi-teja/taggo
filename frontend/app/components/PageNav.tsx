import React from 'react';

interface PageNavProps {
  totalTasks: number;
  perPage: number;
  currentPage: number;
  changePage: (page: number) => void;
}

const PageNav: React.FC<PageNavProps> = ({ totalTasks, perPage, currentPage, changePage }) => {
  const isLastPage = currentPage === Math.ceil(totalTasks / perPage);
  const page = currentPage;

  return (
    <div className="flex justify-between items-center shadow-md rounded-md bg-blue-300 text-white">
      <button
        onClick={() => changePage(Math.max(page - 1, 1))}
        disabled={page === 1}
        className={`px-2 py-1 rounded-l-md transition-colors duration-300 ${page === 1
          ? "bg-gray-300 cursor-not-allowed text-gray-700"
          : "bg-blue-500 hover:bg-blue-700 text-white"
          }`}
      >
<i className="m-1 fa fa-angle-left"></i>      </button>
      <div className="flex items-center text-sm text-center text-black">
        <p className="font-semibold mr-2">
          Page {page} of {Math.ceil(totalTasks / perPage)}
        </p>
        <p>
          {Math.max(page * perPage - perPage + 1, 0)}-{Math.min(page * perPage, totalTasks)} of {totalTasks}
        </p>
      </div>
      <button
        onClick={() => changePage(page + 1)}
        disabled={isLastPage}
        className={`px-2 py-1 rounded-r-md transition-colors duration-300 ${isLastPage
          ? "bg-gray-300 cursor-not-allowed text-gray-700"
          : "bg-blue-500 hover:bg-blue-700 text-white"
          }`}
      >
        <i className="m-1 fa fa-angle-right"></i>      
      </button>
    </div>
  );
};

export default PageNav;