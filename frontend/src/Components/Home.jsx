import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../config';

const Home = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [contactEmail, setContactEmail] = useState("");
  const [contacts, setContacts] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [selectedContact, setSelectedContact] = useState("");
  const [newMessageNotifications, setNewMessageNotifications] = useState({});
  const navigate = useNavigate();
  const [userContacts, setuserContacts] = useState([]);


  // User auto logout
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate("/login");
      }

     
    });

    return () => unsubscribe();
  }, [navigate]);

  // Function to fetch contacts and unread message count
  const fetchContacts = async () => {
    if (auth.currentUser) {
      const userEmail = auth.currentUser.email;
      try {
        const response = await fetch(`https://chatapp-dt22.onrender.com/contacts/${userEmail}`);
        if (response.ok) {
          const data = await response.json();
          setContacts(data.map(contact => contact.contactEmail));

          // Fetch unread message count for each contact
          const unreadResponse = await fetch(`https://chatapp-dt22.onrender.com/unread-count/${userEmail}`);
          if (unreadResponse.ok) {
            const unreadData = await unreadResponse.json();
            setUnreadCounts(unreadData);
          } else {
            console.error('Failed to fetch unread counts');
          }
        } else {
          console.error('Failed to fetch contacts');
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
      }
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchContactslist();
    const intervalId = setInterval(fetchContacts, 10000);
    return () => clearInterval(intervalId);
  }, []);

  // Message fetch and mark read
  useEffect(() => {
    if (selectedContact) {
      const fetchMessages = async () => {
        if (auth.currentUser) {
          const userEmail = auth.currentUser.email;
          try {
            const response = await fetch(`https://chatapp-dt22.onrender.com/messages/${userEmail}/${selectedContact}`);
            if (response.ok) {
              const data = await response.json();
              setMessages(data);

              // Mark messages as read when selected
              await fetch(`https://chatapp-dt22.onrender.com/mark-read/${userEmail}/${selectedContact}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
              });

              fetchContacts();
            } else {
              console.error('Failed to fetch messages');
            }
          } catch (error) {
            console.error("Error fetching messages: ", error);
          }
        }
      };

      fetchMessages();

      const intervalId = setInterval(fetchMessages, 10000);
      return () => clearInterval(intervalId);
    }
  }, [selectedContact]);

  const handleSendMessage = async (messageContent) => {
    if (messageContent.trim() !== "" && selectedContact) {
      if (auth.currentUser) {
        const userEmail = auth.currentUser.email;
        try {
          const response = await fetch('https://chatapp-dt22.onrender.com/send-message', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              senderEmail: userEmail,
              receiverEmail: selectedContact,
              message: messageContent,
              status: 'sent'
            }),
          });

          if (response.ok) {
            const result = await response.json();
            setMessage("");
            const messagesResponse = await fetch(`https://chatapp-dt22.onrender.com/messages/${userEmail}/${selectedContact}`);
            if (messagesResponse.ok) {
              const data = await messagesResponse.json();
              setMessages(data);
            } else {
              console.error('Failed to refresh messages');
            }
          } else {
            console.error('Failed to send message');
          }
        } catch (error) {
          console.error('Error sending message:', error);
        }
      }
    }
  };

  // Contact add
  const handleAddContact = async () => {
    if (usercontacts.length > 0) {
      let contactFound = false; // Flag to check if the contact is found

      for (const contact of usercontacts) { // Use for...of instead of forEach
        // alert(`Name: ${contact.username}`);

        if (contact.username === contactEmail) {
          contactFound = true; // Mark contact as found

          if (contactEmail.trim() !== "") {
            if (auth.currentUser) {
              const userEmail = auth.currentUser.email;

              try {
                const response = await fetch('http://localhost:5000/add-contact', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userEmail, contactEmail }),
                });

                if (response.status === 400) {
                  const data = await response.json();
                  alert(data.message); // Show error message from server
                } else if (response.status === 201) {
                  // const data = await response.json();
                  // alert(data);
                  setContactEmail(""); // Clear input field
                  setContacts((prevContacts) => {
                    return prevContacts.includes(contactEmail)
                      ? prevContacts
                      : [...prevContacts, contactEmail];
                  });
                } else {
                  console.error('Failed to add contact:', await response.text());
                }
              } catch (error) {
                console.error('Error adding contact:', error);
              }
            }
          }
        }
      }

      if (!contactFound) {
        alert('Contact is not our buddy'); // Notify if contact not found
      }
    } else {
      alert('No contacts available'); // Handle case when there are no contacts
    }
  };
  
  // Logout
  const logout = () => {
    signOut(auth).then(() => {
      navigate("/login");
    }).catch((error) => {
      console.error("Error signing out: ", error);
    });
  };

  // Message component
  const Message = ({ message }) => {
    return (
      <div className={`mb-2 p-2 rounded-lg ${message.senderEmail === auth.currentUser.email ? "bg-blue-100 text-right" : "bg-gray-200 text-left"}`}>
        <span className="block text-lg">{message.message}</span>
        <span className="block text-sm text-gray-600">{new Date(message.timestamp).toLocaleString()}</span>
      </div>
    );
  };

  // Check for new messages
  const checkForNewMessages = async () => {
    if (auth.currentUser) {
      const userEmail = auth.currentUser.email;
      try {
        const response = await fetch(`https://chatapp-dt22.onrender.com/messages/${userEmail}/${selectedContact}`);
        if (response.ok) {
          const data = await response.json();
          const unreadMessages = data.filter(msg => msg.status !== 'read');

          if (unreadMessages.length > 0) {
            setNewMessageNotifications(prev => ({
              ...prev,
              [selectedContact]: true,
            }));

            setTimeout(() => {
              setNewMessageNotifications(prev => ({
                ...prev,
                [selectedContact]: false,
              }));
            }, 5000); // Clear after 5 seconds
          }
        }
      } catch (error) {
        console.error("Error checking for new messages: ", error);
      }
    }
  };

  //clear chat
  const handleClearChat = async () => {
    if (selectedContact) {
      if (auth.currentUser) {
        const userEmail = auth.currentUser.email;
        try {
          const response = await fetch(`https://chatapp-dt22.onrender.com/clear-chat/${userEmail}/${selectedContact}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            setMessages([]);
            const data = await response.json();
            alert(data.message);
            fetchContacts();
          } else {
            console.error('Failed to clear chat');
          }
        } catch (error) {
          console.error('Error clearing chat:', error);
        }
      }
    }
  };

  
    //fetch contacts for validation
    const fetchContactslist = async () => {
      try {
        const response = await fetch('https://chatapp-dt22.onrender.com/api/contactsfetch');
        const data = await response.json();
        // console.log(data);
        setuserContacts(data); // Store the fetched contacts in state
        // console.log(usercontacts);
      } catch (error) {
        console.error("Error fetching contacts:", error);
      }
    };
  

  useEffect(() => {
    const intervalId = setInterval(checkForNewMessages, 5000); // Check every 5 seconds
    return () => clearInterval(intervalId);
  }, [selectedContact]);

  return (
    <div className="flex flex-col h-screen bg-gray-100 md:flex-row">
      <div className="w-full p-4 bg-white border-r border-gray-300 md:w-1/4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-800">Chat Room</h1>
          <div className="text-gray-600">{auth.currentUser ? auth.currentUser.email : "Loading..."}</div>
          <button
            onClick={logout}
            className="px-4 py-2 ml-2 text-lg font-semibold text-white transition duration-300 bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            Logout
          </button>
        </div>

        <div className="flex mb-4 space-x-4">
          <input
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            type="text"
            placeholder="Add contact"
            className="w-full p-2 border border-gray-300 rounded-lg"
          />
          <button
            onClick={handleAddContact}
            className="px-4 py-2 text-lg font-semibold text-white transition duration-300 bg-green-600 rounded-lg hover:bg-green-700"
          >
            Add
          </button>
        </div>

        <ul className="h-full p-2 space-y-2 bg-slate-200">
          {contacts.map((contact) => (
            <li
              key={contact}
              onClick={() => setSelectedContact(contact)}
              className={`p-2 cursor-pointer rounded-lg 
                ${selectedContact === contact ? "bg-blue-100 font-bold" : "bg-white"} 
                ${unreadCounts[contact] ? "text-red-500" : "text-gray-800"} 
                ${newMessageNotifications[contact] ? "bg-yellow-200 animate-pulse" : ""}`} // Blinking effect
            >
              {contact} {unreadCounts[contact] > 0 && <span className="text-xs font-semibold text-red-500">({unreadCounts[contact]})</span>}
            </li>
          ))}
        </ul>
      </div>

      <div className="w-full p-4 md:w-3/4">
        {selectedContact ? (
          <>
            <div className="flex flex-col h-full p-4 bg-white border border-gray-300 rounded-lg">
              <h2 className="mb-4 text-2xl font-semibold">{selectedContact}</h2>
              <div className="flex-grow overflow-y-auto">
                {messages.map((msg, index) => (
                  <Message key={index} message={msg} />
                ))}
              </div>
              <div className="flex mt-4">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-grow p-2 border border-gray-300 rounded-lg"
                />
                <button
                  onClick={() => handleSendMessage(message)}
                  className="px-4 py-2 ml-2 text-lg font-semibold text-white transition duration-300 bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Send
                </button>
                <button
                  onClick={handleClearChat}
                  className="px-4 py-2 ml-2 text-lg font-semibold text-white transition duration-300 bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Clear Chat
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600">
            Select a contact to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
