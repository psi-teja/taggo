"use client";
import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import Link from "next/link";
import { HiHome } from "react-icons/hi";
import Header from "../utils/Header";

interface Setting {
  key: string;
  value: string;
  description: string;
}

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Setting[] | null>(null);
  const [homeReady, setHomeReady] = useState<boolean>(false);

  const fetchSettings = () => {
    axiosInstance
      .get("/get_settings")
      .then((response) => {
        setSettings(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = () => {
    axiosInstance
      .post("/update_settings/", settings)
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleValueChange = (index: number, newValue: string) => {
    const newSettings = settings ? [...settings] : [];
    newSettings[index].value = newValue;
    setSettings(newSettings);
  };

  return (
    <div className="">
      <Header>
        {" "}
        <Link
          href="/labelling"
          className="text-teal-900 hover:underline flex items-center"
          onClick={() => setHomeReady(true)}
        >
          <HiHome className="m-1 text-2xl" />
          <p className="m-1 text-lg font-semibold">Home</p>
        </Link>
        <div className="text-2xl font-bold text-gray-800 flex items-center">
          <svg
            className="w-6 h-6 mr-2"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7.75 4H19M7.75 4a2.25 2.25 0 0 1-4.5 0m4.5 0a2.25 2.25 0 0 0-4.5 0M1 4h2.25m13.5 6H19m-2.25 0a2.25 2.25 0 0 1-4.5 0m4.5 0a2.25 2.25 0 0 0-4.5 0M1 10h11.25m-4.5 6H19M7.75 16a2.25 2.25 0 0 1-4.5 0m4.5 0a2.25 2.25 0 0 0-4.5 0M1 16h2.25"
            />
          </svg>
          Settings
        </div>
      </Header>
      <h1 className="text-2xl m-6 text-center text-gray-800 font-bold">
        Sampling parameters
      </h1>
      <div className="flex justify-center mb-6"></div>
      {settings ? (
        <div className="flex flex-col gap-6 m-4">
          {settings.map((setting, index) => (
            <div
              key={index}
              className="p-6 border rounded-lg shadow-md bg-white relative"
            >
              <div className="flex justify-between items-center mb-4">
                <p className="text-gray-700">On</p>
                <h3>{setting.key}</h3>
                <span className="text-xl font-semibold text-blue-600">
                  {setting.value}%
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={setting.value}
                  onChange={(e) => handleValueChange(index, e.target.value)}
                  className="slider w-2/3 mr-5"
                />
              </div>
              <p className="text-gray-500 mt-2">{setting["description"]}</p>
            </div>
          ))}

          <div className="flex justify-center m-6 gap-4">
            <button
              onClick={fetchSettings}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow-md hover:bg-blue-700 transition duration-300 flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="w-5 h-5 mr-2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v6h6M20 20v-6h-6"
                />
              </svg>
              Reset
            </button>
            <button
              onClick={updateSettings}
              className="bg-green-600 text-white px-6 py-2 rounded-lg shadow-md hover:bg-green-700 transition duration-300 flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="w-5 h-5 mr-2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-96">
          <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 mx-auto animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
