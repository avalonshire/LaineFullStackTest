import { useState } from "react";

type EditContractProps = {
  handleUpdate: (event: React.FormEvent<HTMLFormElement>) => void;
  handleCancelEdit: () => void;
  contractContent: string;
  contractType: 'Employment Agreement' | 'Loan' | 'Service Agreement';
  contractAddress: string;
  contractName: string;
  id: string;
  contractTypes?: ('Employment Agreement' | 'Loan' | 'Service Agreement')[];
};

const EditContract: React.FC<EditContractProps> = ({
  handleUpdate,
  handleCancelEdit,
  contractContent,
  contractType,
  contractAddress,
  contractName,
  id,
  contractTypes = ['Employment Agreement', 'Loan', 'Service Agreement'],
}) => {

const [updateFormData, setUpdateFormData] = useState({
    contractName: contractName,
    contractAddress: contractAddress,
    contractType: contractType,
    contractContent: contractContent,
    id: id,
  });
 
  return (
    <>
      <div className="edit-modal-overlay">
        <div className="edit-modal">
          <h2>Edit Contract</h2>
          <form onSubmit={handleUpdate} className="edit-form">
            <div className="form-group">
              <label htmlFor="contractType">Contract Type:</label>
              <select
                id="contractType"
                value={contractType}
                
                required
              >
                {contractTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="clientName">Client Name:</label>
              <input
                type="text"
                id="clientName"
                value={contractName}
                
                placeholder="Enter client name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="clientAddress">Client Address:</label>
              <textarea
                id="clientAddress"
                value={updateFormData.contractAddress}
                onChange={(e) =>
                  setUpdateFormData((prev) => ({
                    ...prev,
                    contractAddress: e.target.value,
                  }))
                }
                placeholder="Enter client address"
                required
              />
            </div>
            <div>
              <div className="form-group">
                <label htmlFor="contractContent">Contract</label>
                <textarea
                  id="contractContent"
                  value={updateFormData.contractContent}
                  onChange={(e) =>
                  setUpdateFormData((prev) => ({
                    ...prev,
                    contractContent: e.target.value,
                  }))
                }
                  placeholder="Edit Contract Content"
                  required
                />
              </div>
            </div>
            <div className="edit-form-actions">
              <button type="submit" className="update-btn">
                Update Contract
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditContract;
