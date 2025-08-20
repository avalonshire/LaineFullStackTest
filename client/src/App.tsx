import React, { useState, useEffect } from "react";
import EditContract from "./components/EditContract";
import GeneratedContracts from "./components/GeneratedContracts";
import "./App.css";

interface Contract {
  id: string;
  clientName: string;
  clientAddress: string;
  contractType: "Employment Agreement" | "Loan" | "Service Agreement";
  contractContent: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

function App() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    clientAddress: "",
    contractType: "Employment Agreement" as const,
  });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      text: "Hello! I'm your AI legal assistant specializing in contract law and business agreements. I can help you with contract-related questions, legal terms, negotiation tips, and best practices. What would you like to know about contracts?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [editFormData, setEditFormData] = useState({
    clientName: "",
    clientAddress: "",
    contractType: "Employment Agreement" as
      | "Employment Agreement"
      | "Loan"
      | "Service Agreement",
    contractContent: "",
  });

  const [updateFormData, setUpdateFormData] = useState({
    contractName: "",
    contractAddress: "",
    contractType: "Employment Agreement" as
      | "Employment Agreement"
      | "Loan"
      | "Service Agreement",
    contractContent: "",
    id: "",
  });

  const contractTypes = ["Employment Agreement", "Loan", "Service Agreement"];

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const response = await fetch("http://localhost:8080/contracts", {
        method: "GET",
        headers: {},
      });
      const data = await response.json();
      if (data.success) {
        setContracts(data.data);
      }
    } catch (error) {
      console.error("Error fetching contracts:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { clientName, clientAddress, contractType } = formData;
    try {
      const response = await fetch("http://localhost:8080/generate-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: clientName,
          clientAddress: clientAddress,
          contractType: contractType,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setFormData({
          clientName: clientName,
          clientAddress: clientAddress,
          contractType: contractType,
        });
      } else {
        alert("Error generating contract: " + data.message);
      }
    } catch (error) {
      console.error("Error generating contract:", error);
      alert("Error generating contract");
    } finally {
      fetchContracts();
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    if (window.confirm("Are you sure you want to delete this contract?")) {
      try {
        const response = await fetch(`http://localhost:8080/contracts/${id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        if (data.success) {
          fetchContracts();
        } else {
          alert("Error deleting contract: " + data.message);
        }
      } catch (error) {
        console.error("Error deleting contract:", error);
        alert("Error deleting contract");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setEditFormData({
      clientName: contract.clientName,
      clientAddress: contract.clientAddress,
      contractType: contract.contractType,
      contractContent: contract.contractContent,
    });
  };

  const handleUpdate = async (
    e: React.FormEvent<HTMLFormElement>,
    updateFormData: {
      contractName: string;
      contractAddress: string;
      contractType: "Employment Agreement" | "Loan" | "Service Agreement";
      contractContent: string;
      id: string;
    }
  ) => {
    e.preventDefault();
    if (!editingContract) return;
    console.log("Updating contract:", updateFormData);
    try {
      const response = await fetch(
        `http://localhost:8080/contracts/${updateFormData.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientName: updateFormData.contractName,
            clientAddress: updateFormData.contractAddress,
            contractType: updateFormData.contractType,
            contractContent: updateFormData.contractContent,
          }),
        }
      );
      const data = await response.json();
      if (data.success) {
        setEditingContract(null);
        setEditFormData({
          clientName: "",
          clientAddress: "",
          contractType: "Employment Agreement",
          contractContent: "",
        });
      } else {
        alert("Error updating contract: " + data.message);
      }
    } catch (error) {
      console.error("Error updating contract:", error);
      alert("Error updating contract");
    } finally {
      fetchContracts();
    }
  };

  const handleCancelEdit = () => {
    setEditingContract(null);
    setEditFormData({
      clientName: "",
      clientAddress: "",
      contractType: "Employment Agreement",
      contractContent: "",
    });
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: chatInput,
      isUser: true,
      timestamp: new Date(),
    };
    console.log("User message:", userMessage);
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");

    // Add loading state for AI response
    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      text: "Thinking...",
      isUser: false,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, loadingMessage]);
    console.log("chat input:", chatInput);
    try {
      const response = await fetch("http://localhost:8080/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: chatInput }),
      });
      const data = await response.json();
      console.log("AI response:", data);
      /*const data = {
        success: false,
        message: 'Supply missing code',
        data: {
          response: 'Supply missing code',
        },
      };*/
      if (data.success) {
        // Remove loading message and add AI response
        setChatMessages((prev) =>
          prev.filter((msg) => msg.id !== loadingMessage.id)
        );
        const aiMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          text: data.data.response,
          isUser: false,
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, aiMessage]);
      } else {
        // Remove loading message and add error response
        setChatMessages((prev) =>
          prev.filter((msg) => msg.id !== loadingMessage.id)
        );
        const errorMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          text: "Sorry, I encountered an error. Please try asking your question again.",
          isUser: false,
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Error in AI chat:", error);
      // Remove loading message and add error response
      setChatMessages((prev) =>
        prev.filter((msg) => msg.id !== loadingMessage.id)
      );
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        text: "Sorry, I'm having trouble connecting to my AI service. Please try again later.",
        isUser: false,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <div className="App">
      <header className="header">
        <h1>Contract Generator</h1>
        <button
          className="chat-toggle-btn"
          onClick={() => setShowChat(!showChat)}
        >
          {showChat ? "Hide Chat" : "Show Chat"}
        </button>
      </header>

      <div className="main-content">
        <div className="form-section">
          <h2>Generate New Contract</h2>
          <form onSubmit={handleSubmit} className="contract-form">
            <div className="form-group">
              <label htmlFor="contractType">Contract Type:</label>
              <select
                id="contractType"
                value={formData.contractType}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    contractType: e.target.value as any,
                  }))
                }
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
                value={formData.clientName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    clientName: e.target.value,
                  }))
                }
                placeholder="Enter client name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="clientAddress">Client Address:</label>
              <textarea
                id="clientAddress"
                value={formData.clientAddress}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    clientAddress: e.target.value,
                  }))
                }
                placeholder="Enter client address"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? "Generating..." : "Generate Contract"}
            </button>
          </form>
        </div>
        <GeneratedContracts
          contracts={contracts}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          loading={loading}
        />
        

        {/* Edit Contract Modal */}
        {editingContract && (
          <EditContract
            handleUpdate={handleUpdate}
            contractContent={editingContract.contractContent}
            contractType={editingContract.contractType}
            contractAddress={editingContract.clientAddress}
            contractName={editingContract.clientName}
            id={editingContract.id}
            handleCancelEdit={handleCancelEdit}
          />
        )}

        {showChat && (
          <div className="chat-section">
            <h2>AI Legal Assistant - Contract Support</h2>
            <div className="chat-messages">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`chat-message ${message.isUser ? "user" : "ai"}`}
                >
                  <div className="message-content">{message.text}</div>
                  <div className="message-time">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleChatSubmit} className="chat-input-form">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask me about contracts, legal terms, or business agreements..."
                className="chat-input"
              />
              <button type="submit" className="chat-send-btn">
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
