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
  const [newMessageIds, setNewMessageIds] = useState(new Set());
  // const [userEmails, setUserEmails] = useState([]); // from fire base
  const [usercontacts, setuserContacts] = useState([]);
  const navigate = useNavigate();

  //user auto  logout
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
        const response = await fetch(`http://localhost:5000/contacts/${userEmail}`);
        if (response.ok) {
          const data = await response.json();
          setContacts(data.map(contact => contact.contactEmail));

          // Fetch unread message count for each contact
          const unreadResponse = await fetch(`http://localhost:5000/unread-count/${userEmail}`);
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
    const intervalId = setInterval(fetchContacts, 10000);
    return () => clearInterval(intervalId);
  }, []);




  // message fetch and mark read
  useEffect(() => {
    if (selectedContact) {
      const fetchMessages = async () => {
        if (auth.currentUser) {
          const userEmail = auth.currentUser.email;
          try {
            const response = await fetch(`http://localhost:5000/messages/${userEmail}/${selectedContact}`);
            if (response.ok) {
              const data = await response.json();
              setMessages(data);
              // console.log(data + 'ddd');

              // Loop through each message and mark it as "read"
              // data.forEach(async (message) => {
              //   // console.log(message.read);
              //   if (message.status !== 'read') {
              //     await updateMessageStatus(message._id, 'read'); // Mark message as read
              //   }
              // }); 


              // Mark messages as read when selected
              await fetch(`http://localhost:5000/mark-read/${userEmail}/${selectedContact}`, {
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

      // Set up polling to re-fetch messages every 10 seconds (or other interval)
      const intervalId = setInterval(fetchMessages, 10000); // Re-fetch every 10 seconds

      // Clean up interval when component unmounts or selectedContact changes
      return () => clearInterval(intervalId);

    }
  }, [selectedContact]);



  const handleViewMessages = async () => {
    if (auth.currentUser) {
      const userEmail = auth.currentUser.email;
      try {
        const response = await fetch(`http://localhost:5000/messages/${userEmail}/${selectedContact}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data);

          // Mark unread messages as read
          const unreadMessages = data.filter(message => message.status !== 'read');
          if (unreadMessages.length > 0) {
            await fetch('http://localhost:5000/mark-read', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                senderEmail: selectedContact,
                receiverEmail: userEmail
              })
            });
          }

          fetchContacts(); // Refresh contact list if necessary

        } else {
          console.error('Failed to fetch messages');
        }
      } catch (error) {
        console.error("Error marking messages as read: ", error);
      }
    }
  };



  // send mesg
  const handleSendMessage = async (messageContent) => {
    if (messageContent.trim() !== "" && selectedContact) {
      if (auth.currentUser) {
        const userEmail = auth.currentUser.email;
        try {
          const response = await fetch('http://localhost:5000/send-message', {
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
            // handleViewMessages();
            await updateMessageStatus(result.messageId, 'delivered');

            const messagesResponse = await fetch(`http://localhost:5000/messages/${userEmail}/${selectedContact}`);
            if (messagesResponse.ok) {
              const data = await messagesResponse.json();
              setMessages(data);
              setNewMessageIds(prev => new Set([...prev, result.id]));
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

  //contact add
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

  // message status
  const updateMessageStatus = async (messageId, status) => {
    try {
      const response = await fetch('http://localhost:5000/update-message-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageId, status }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Message status updated:', result);
      } else {
        console.error('Failed to update message status');
      }
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  };


  //clear chat
  const handleClearChat = async () => {
    if (selectedContact) {
      if (auth.currentUser) {
        const userEmail = auth.currentUser.email;
        try {
          const response = await fetch(`http://localhost:5000/clear-chat/${userEmail}/${selectedContact}`, {
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
      const response = await fetch('http://localhost:5000/api/contactsfetch');
      const data = await response.json();
      // console.log(data);
      setuserContacts(data); // Store the fetched contacts in state
      // console.log(usercontacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  };

  useEffect(() => {
    fetchContactslist();
    // console.log(usercontacts);
  }, []);




  //logout
  const logout = () => {
    signOut(auth).then(() => {
      navigate("/login");
    }).catch((error) => {
      console.error("Error signing out: ", error);
    });
  };

  // message tick
  const Message = ({ message, status }) => {
    let tickIcon;
    if (status === 'read') {
      tickIcon = '✔✔';
    } else if (status === 'delivered') {
      tickIcon = '✔';
    } else {
      tickIcon = '';
    }

    return (
      <div
        className={`mb-2 p-2 rounded-lg ${message.senderEmail === auth.currentUser.email ? "bg-blue-100 text-right" : "bg-gray-200 text-left"} ${newMessageIds.has(message.id) ? "border-l-4 border-blue-500" : ""}`}
      >
        <span className="block text-lg">{message.message}</span>
        <span className="block text-sm text-gray-600">{new Date(message.timestamp).toLocaleString()}</span>
        <span className="block text-sm text-gray-600">{status}</span>
        {/* <span className="block text-sm text-gray-600">{tickIcon}</span> */}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-1/4 p-4 bg-white border-r border-gray-300">
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

        <ul className="space-y-2">
          {contacts.map((contact) => (
            <div>
              <li
                key={contact}
                onClick={() => {
                  setSelectedContact(contact);

                }

                }
                className={`p-2 cursor-pointer rounded-lg ${selectedContact === contact ? "bg-blue-100 font-bold" : "bg-white"} ${unreadCounts[contact] ? "text-red-500" : "text-gray-800"}`}
              >
                {contact} {unreadCounts[contact] > 0 && <span className="text-xs font-semibold text-red-500">({unreadCounts[contact]})</span>}
              </li>

            </div>


          ))
          }

        </ul>

      </div>

      <div className="w-3/4 p-4">
        {selectedContact ? (
          <>
            <div className="flex flex-col h-full p-4 bg-white border border-gray-300 rounded-lg">
              <div className="flex-1 overflow-auto">
                {messages.map((message) => (
                  <Message
                    key={message.id}
                    message={message}
                    status={message.status}
                  />
                ))}
              </div>

              <div className="flex mt-4">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  type="text"
                  placeholder="Type a message..."
                  className="w-full p-2 border border-gray-300 rounded-lg"
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
          <div className="flex items-center justify-center h-full text-gray-600">Select a contact to start chatting</div>
        )}
      </div>
    </div>
  );
};

export default Home;
