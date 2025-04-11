import React from 'react';

interface ActionButtonsProps {
  status: string;
  dataChanged: boolean;
  actionPending: boolean;
  handleSave: () => void;
  handleReset: () => void;
  handleSubmit: () => void;
  handleAccept: () => void;
  handleReject: () => void;
  handleMoveToCompleted: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ status, dataChanged, actionPending, handleSave, handleReset, handleSubmit, handleAccept, handleReject, handleMoveToCompleted }) => {

  if (status === 'pre-labelled') {
    return null;
  }

  return (
    <div className="p-2 flex justify-center items-center space-x-4 bg-blue-300">
      {actionPending ? (
        <div className="flex items-center justify-center">
        <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 mx-auto animate-spin"></div>
      </div>
      ) : (
        <div className="flex space-x-2">
          <button
            onClick={() => {
              handleSave();
            }}
            disabled={!dataChanged}
            className={`${
              dataChanged
                ? 'bg-green-500 hover:bg-green-700 shadow-lg'
                : 'bg-gray-300 text-gray-400 cursor-not-allowed shadow-none'
            } text-white py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-300`}
          >
            save
          </button>
          <button
            onClick={() => {
              handleReset();
            }}
            disabled={!dataChanged}
            className={`${
              dataChanged
                ? 'bg-yellow-500 hover:bg-yellow-700 shadow-lg'
                : 'bg-gray-300 text-gray-400 cursor-not-allowed shadow-none'
            } text-white py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-300`}
          >
            reset
          </button>
          {status === 'in-labelling' && (
            <button
              onClick={() => {
                handleSubmit();
              }}
              className="bg-blue-500 hover:bg-blue-700 shadow-lg text-white py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              submit
            </button>
          )}

          {['in-review', 'accepted', 'completed'].includes(status) && (
            <button
              onClick={() => {
                handleReject();
              }}
              className={
                'bg-red-500 hover:bg-red-700 shadow-lg text-white py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-300'
              }
            >
              reject
            </button>
          )}
          {status === 'in-review' && (
            <button
              onClick={() => {
                handleAccept();
              }}
              className="bg-purple-500 hover:bg-purple-700 shadow-lg text-white py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              accept
            </button>
          )}
          {status === 'accepted' && (
            <button
              onClick={() => {
                handleMoveToCompleted();
              }}
              className="bg-teal-500 hover:bg-teal-700 shadow-lg text-white py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-300"
            >
              move to completed
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ActionButtons;