"use client";
import { useState, useEffect } from "react";
import axiosInstance from "@/app/utils/axiosInstance";
import { FaChevronDown, FaChevronUp, FaCheck } from "react-icons/fa"; // Import icons

interface InvoiceTypes {
  invoice_types: {
    [key: string]: string[];
  };
}

interface Props {
  doc_id: string;
  is_superuser: boolean;
  segregation_status: string;
  invoice_type: string;
  invoice_subtype: string;
  viewType: string;
  handleNextClick: () => void;
}

const SegregateInvoice: React.FC<Props> = ({
  doc_id,
  is_superuser,
  segregation_status,
  invoice_type,
  invoice_subtype,
  viewType,
  handleNextClick,
}) => {
  const [invoiceTypes, setInvoiceTypes] = useState<InvoiceTypes | null>(null);
  const [openCard, setOpenCard] = useState<string | null>(null);
  const [selectedSubtypes, setSelectedSubtypes] = useState<{
    [type: string]: string[];
  }>({});
  const [showAddTypeInput, setShowAddTypeInput] = useState(false); // State to toggle input bar
  const [newType, setNewType] = useState("");
  const [showAddSubtypeInput, setShowAddSubtypeInput] = useState<{
    [type: string]: boolean;
  }>({}); // State to toggle input bar for each type
  const [newSubtype, setNewSubtype] = useState<{ [type: string]: string }>({});
  const [newlyAddedTypes, setNewlyAddedTypes] = useState<{
    [key: string]: string[];
  }>({});

  const fetchAnnotations = async () => {
    try {
      const response = await axiosInstance.get(`/get_invoice_types/`);
      if (response.status >= 200 && response.status < 300) {
        console.log("Invoice types are fetched");
      } else {
        throw new Error("Failed to fetch data");
      }
      const invoiceTypes: InvoiceTypes = await response.data;
      setInvoiceTypes(invoiceTypes);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchAnnotations();
  }, []);

  const handleCardClick = (type: string) => {
    // Reset selectedSubtypes when a new type is clicked
    if (openCard !== type) {
      setSelectedSubtypes({});
    }

    // If "Others" is clicked, set it as selected with an empty array
    if (type === "Others") {
      setSelectedSubtypes({ Others: [] });
    }

    setOpenCard(openCard === type ? null : type);
  };

  const handleSubtypeClick = (type: string, subtype: string) => {
    setSelectedSubtypes((prev) => {
      const updatedSubtypes = { ...prev };

      // Ensure the selected type exists in the state
      if (!updatedSubtypes[type]) {
        updatedSubtypes[type] = [];
      }

      // Toggle subtype selection
      if (updatedSubtypes[type].includes(subtype)) {
        updatedSubtypes[type] = updatedSubtypes[type].filter(
          (item) => item !== subtype
        );
      } else {
        updatedSubtypes[type] = [...updatedSubtypes[type], subtype];
      }

      return updatedSubtypes;
    });
  };

  const handleAddTypeOrSubtype = async (type: string, subtypes: string[]) => {
    setNewlyAddedTypes((prev) => {
      const updatedTypes = { ...prev };
      // If the type is new, add it with all its subtypes
      if (!updatedTypes[type]) {
        updatedTypes[type] = subtypes;
      } else {
        // If the type already exists, add only new subtypes
        const existingSubtypes = updatedTypes[type];
        const newSubtypes = subtypes.filter(
          (subtype) => !existingSubtypes.includes(subtype)
        );
        updatedTypes[type] = [...existingSubtypes, ...newSubtypes];
      }
      return updatedTypes;
    });
  };

  // Use useEffect to trigger the API call after newlyAddedTypes is updated
  useEffect(() => {
    const updateInvoiceTypes = async () => {
      if (Object.keys(newlyAddedTypes).length > 0) {
        try {
          const response = await axiosInstance.post(
            "/put_invoice_types/",
            { invoice_types: newlyAddedTypes },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          if (response.status >= 200 && response.status < 300) {
            console.log("Invoice types and subtypes updated successfully");
            setNewlyAddedTypes({}); // Clear the state after successful submission
          } else {
            console.error(
              "Failed to update invoice types:",
              response.statusText
            );
          }
        } catch (error: any) {
          console.error(
            "Error during update:",
            error.response?.data.message || error.message
          );
        }
      }
    };

    updateInvoiceTypes();
  }, [newlyAddedTypes]);

  const handleSubmit = async () => {
    // Early exit if no subtypes are selected
    if (Object.keys(selectedSubtypes).length === 0) {
      alert("Select invoice type or Skip");
      return;
    }

    console.log("Selected subtypes:", selectedSubtypes);

    try {
      // Fetch the file
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      const fileUrl = `${API_BASE_URL}/get_document_seg/${doc_id}`;

      const fileResponse = await axiosInstance.get(fileUrl, {
        responseType: "blob",
      });
      console.log(fileResponse);
      const file = new Blob([fileResponse.data], {
        type: fileResponse.headers["content-type"],
      });
      console.log(file);
      // Prepare FormData
      const formData = new FormData();
      console.log(formData);
      formData.append("document", file, "document.pdf");
      formData.append("invoice_types", JSON.stringify(selectedSubtypes));
      formData.append("id", doc_id);

      for (const [key, value] of formData.entries()) {
        console.log(key, value);
      }
      console.log(formData);
      // Submit the form data
      const submitResponse = await axiosInstance.post(
        "/submit_segregated_s3/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Handle success
      if (submitResponse.status >= 200 && submitResponse.status < 300) {
        console.log("File uploaded successfully");
        handleNextClick(); // Fetch the next document
      } else {
        console.error("Failed to upload file:", submitResponse.statusText);
      }
    } catch (error: any) {
      // Handle errors
      const errorMessage =
        error.response?.data.message || error.message || "Network error";
      console.error("Error during file upload:", errorMessage);
    }
  };

  const handleSkip = async () => {
    try {
      const skipResponse = await axiosInstance.post(
        "/skip_segregation/",
        { doc_id }, // Ensure this is an object, not just doc_id
        { headers: { "Content-Type": "application/json" } }
      );

      if (skipResponse.status >= 200 && skipResponse.status < 300) {
        console.log("File skipped successfully");
        handleNextClick(); // Fetch the next document
      } else {
        console.error("Failed to skip file:", skipResponse.statusText);
      }
    } catch (error: any) {
      // Handle errors
      const errorMessage =
        error.response?.data.message || error.message || "Network error";
      console.error("Error during file skip:", errorMessage);
    }
  };

  const handleAddType = () => {
    if (newType.trim() === "") {
      alert("Please enter a valid invoice type.");
      return;
    }

    // Update the invoiceTypes state with the new type
    setInvoiceTypes((prev) => {
      if (!prev) return prev; // If prev is null, return early

      const updatedInvoiceTypes = { ...prev };
      updatedInvoiceTypes.invoice_types[newType] = []; // Add the new type with an empty array of subtypes
      return updatedInvoiceTypes;
    });
    handleAddTypeOrSubtype(newType, []);
    // Reset the input and hide the input bar
    setNewType("");
    setShowAddTypeInput(false);
  };

  const handleAddSubtype = (type: string) => {
    if (!newSubtype[type] || newSubtype[type].trim() === "") {
      alert("Please enter a valid subtype.");
      return;
    }
    // Check if the subtype already exists
    if (invoiceTypes?.invoice_types[type].includes(newSubtype[type])) {
      alert("Subtype already exists.");
      return;
    }
    // Update the invoiceTypes state with the new subtype
    setInvoiceTypes((prev) => {
      if (!prev) return prev; // If prev is null, return early
      const updatedInvoiceTypes = JSON.parse(JSON.stringify(prev));
      updatedInvoiceTypes.invoice_types[type] = [
        ...updatedInvoiceTypes.invoice_types[type],
        newSubtype[type],
      ]; // Add the new subtype to the type
      return updatedInvoiceTypes;
    });
    handleAddTypeOrSubtype(type, [newSubtype[type]]);
    // Reset the input and hide the input bar for the specific type
    setNewSubtype((prev) => ({ ...prev, [type]: "" }));
    setShowAddSubtypeInput((prev) => ({ ...prev, [type]: false }));
  };

  if (!invoiceTypes) {
    return (
      <div className="flex items-center justify-center h-full w-[35vw]">
        <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 mx-auto animate-spin"></div>
      </div>
    );
  }

  const invoiceTypeEntries: [string, string[]][] = [
    ...Object.entries(invoiceTypes.invoice_types),
    ["Others", []],
  ];

  return (
    <div className="w-[35vw] text-center justify-between overflow-hidden overflow-y-auto custom-scrollbar">
      <div className="flex flex-col max-w-7xl max-auto mt-4">
        <div className="relative pr-2 m-2">
          {invoiceTypeEntries.map(([type, items]) => (
            <div
              key={type}
              className="my-2 p-4 bg-white border border-blue-300 rounded-md shadow-md hover:shadow-lg transition duration-600 ease-in-out justify-center cursor-pointer"
              onClick={() => {
                handleCardClick(type);
              }}
            >
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold">{type}</p>
                {type === "Others" && selectedSubtypes[type] && (
                  <FaCheck className="text-green-500" />
                )}
                {/* Dropdown Chevron (not for "Others") */}
                {type !== "Others" &&
                  (openCard === type ? (
                    <FaChevronUp className="text-gray-600" />
                  ) : (
                    <FaChevronDown className="text-gray-600" />
                  ))}
              </div>
              {/* Dropdown List (not for "Others") */}
              {type !== "Others" && openCard === type && (
                <ul className="mt-2 pl-4 border-l-2 border-blue-200">
                  {[...items, "Others"].map((item, index) => (
                    <li
                      key={index}
                      className="flex justify-between items-center text-sm text-gray-700 py-1 hover:bg-blue-50 rounded-md transition duration-200 ease-in-out cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click event from firing
                        handleSubtypeClick(type, item);
                      }}
                    >
                      <span>{item}</span>
                      {selectedSubtypes[type]?.includes(item) && (
                        <FaCheck className="text-green-500" />
                      )}
                    </li>
                  ))}
                  {/* "+Subtype" Button and Input Bar */}
                  {is_superuser && (
                    <li className="mt-2">
                      <div className="flex justify-start">
                        {!showAddSubtypeInput[type] ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card click event from firing
                              setShowAddSubtypeInput((prev) => ({
                                ...prev,
                                [type]: true,
                              }));
                            }}
                            className="bg-blue-500 text-white py-1 px-3 rounded-md hover:bg-blue-600 transition duration-300 ease-in-out text-sm"
                          >
                            +Subtype
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              // value={newSubtype[type] || ""}
                              onChange={(e) => {
                                setNewSubtype((prev) => ({
                                  ...prev,
                                  [type]: e.target.value,
                                }));
                              }}
                              placeholder="Enter new subtype"
                              className="p-1 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              onClick={(e) => e.stopPropagation()} // Prevent card click event from firing
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent card click event from firing
                                handleAddSubtype(type);
                              }}
                              className="bg-green-500 text-white py-1 px-3 rounded-md hover:bg-green-600 transition duration-300 ease-in-out text-sm"
                            >
                              Add
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent card click event from firing
                                setNewSubtype((prev) => ({
                                  ...prev,
                                  [type]: "",
                                })); // Clear input
                                setShowAddSubtypeInput((prev) => ({
                                  ...prev,
                                  [type]: false,
                                })); // Hide input bar
                              }}
                              className="bg-gray-500 text-white py-1 px-3 rounded-md hover:bg-gray-600 transition duration-300 ease-in-out text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  )}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Submit and Skip Buttons - Fixed at the bottom */}
        <div className="sticky bottom-0 bg-white border-t border-gray-500">
          {/* "+Invoice Type" Button and Input Bar */}
          {is_superuser && (
            <div className="flex justify-end m-2">
              {!showAddTypeInput ? (
                <button
                  onClick={() => setShowAddTypeInput(true)}
                  className="bg-blue-500 text-white text-sm py-1 px-3 rounded-md hover:bg-blue-600 transition duration-300 ease-in-out"
                >
                  +Type
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newType}
                    onChange={(e) => {
                      setNewType(e.target.value);
                    }}
                    placeholder="Enter new invoice type"
                    className="p-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddType}
                    className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition duration-300 ease-in-out"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setNewType("");
                      setShowAddTypeInput(false);
                    }}
                    className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition duration-300 ease-in-out"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Centered "File is Segregated" text */}
          {segregation_status === "segregated" && (
            <div className="ml-4">
              <div className="flex gap-2">
                <h3 className="text-blue-500 text-sm font-semibold mb-4">
                  File Segregated as Type:
                </h3>
                <h3 className="text-green-500 text-sm font-semibold mb-4">
                  {invoice_type}
                </h3>
              </div>
              <div className="flex gap-2">
              <h3 className="text-blue-500 text-sm font-semibold mb-4">
                Subtype:
              </h3>
              <h3 className="text-green-500 text-xs font-semibold mb-4">
                {invoice_subtype}
              </h3>
              </div>
            </div>
          )}
          {Object.entries(selectedSubtypes).map(([type, subtypes]) => (
            <div key={type} className="mb-2">
              {type === "Others" ? (
                <div className="ml-4">
                  <div className="flex gap-2">
                  <h3 className="text-blue-500 text-sm font-semibold mb-4">
                    Selected type:
                  </h3>
                  <h3 className="text-green-500 text-xs font-semibold mb-4">
                    {type}
                  </h3>
                  </div>
                </div>
              ) : (
                <div className="ml-4">
                  <div className="flex gap-2">
                    <h3 className="text-blue-500 text-sm font-semibold mb-4">
                      Selected Type:
                    </h3>
                    <h3 className="text-green-500 text-sm font-semibold mb-4">
                      {type}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <h3 className="text-blue-500 text-sm font-semibold mb-4">
                      Subtypes:
                    </h3>
                    <h3 className="text-green-500 text-sm font-semibold mb-4">
                      {subtypes.join(", ")}
                    </h3>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Centered buttons */}
          <div className="flex justify-center gap-20 mb-2">
            <button
              onClick={handleSkip}
              className="bg-gray-500 text-white py-2 px-6 rounded-md hover:bg-gray-600 transition duration-300 ease-in-out"
            >
              Skip
            </button>
            <button
              onClick={handleSubmit}
              className="bg-green-500 text-white py-2 px-6 rounded-md hover:bg-blue-600 transition duration-300 ease-in-out"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SegregateInvoice;
