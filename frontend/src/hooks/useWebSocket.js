import { useState, useEffect } from 'react';

const useWebSocket = (url) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const ws = new WebSocket(url);
    setSocket(ws);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    return () => {
      ws.close();
    };
  }, [url]);

  const sendMessage = (message) => {
    if (socket) {
      socket.send(JSON.stringify(message));
    }
  };

  return { messages, sendMessage };
};

export default useWebSocket;
