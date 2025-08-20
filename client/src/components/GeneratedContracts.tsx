import { useState } from "react";


interface Contract {
  id: string;
  clientName: string;
  clientAddress: string;
  contractType: "Employment Agreement" | "Loan" | "Service Agreement";
  contractContent: string;
  createdAt: string;
  updatedAt: string;
}

type GeneratedContractsProps = {
  contracts: Contract[];
  handleEdit: (contract: Contract) => void;
  handleDelete: (id: string) => void;
  loading: boolean;
};

const GeneratedContracts: React.FC<GeneratedContractsProps> = ({
  contracts,
  handleEdit,
  handleDelete,
  loading
}) => {
  return (
    <>
      <div className="contracts-section">
        <h2>Generated Contracts ({contracts.length})</h2>
        {contracts.length === 0 ? (
          <p className="no-contracts">No contracts generated yet.</p>
        ) : (
          <div className="contracts-list">
            <ul>
              {contracts.map((contract) => (
                <li key={contract.id} className="contract-card">
                  <div className="contract-details">
                    <div className="contract-header">
                    <h3>
                      Client Name: {contract.clientName}
                    </h3>
                     <h3>Address: {contract.clientAddress}</h3>
                  
                  <p>{contract.contractContent}</p>
                    </div>
                    </div>
                  <button
                    onClick={() => handleEdit(contract)}
                    className="edit-btn"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(contract.id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        { loading &&
        <div className="loader-container">
       <div className="loader"></div>
       </div>}
      </div>
    </>
  );
};

export default GeneratedContracts;
