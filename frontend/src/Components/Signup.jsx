import { createUserWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../config";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [cpassword, setcPassword] = useState("");

  const navigate = useNavigate();

  // Function to handle input changes
  const handleInputChangeone = (e) => {
    setUsername(e.target.value);
  };

  const handleInputChangetwo = (e) => {
    setPassword(e.target.value);
  };

  const handleInputChangethree = (e) => {
    setcPassword(e.target.value);
  };

  // Function to handle form submission
  const handleSubmit = () => {
    if (password === cpassword) {
      createUserWithEmailAndPassword(auth, username, password)
        .then(() => {
          alert("Success");
          setUsername("");
          setPassword("");
          navigate("/login");
        })
        .catch((error) => {
          console.error(error.message);
          alert("Hey buddy kindly provide email address and password");
        });
    } else {
      alert("Password mismatch, recheck please");
    }
  };

  const signupnav = () =>{
    navigate("/signup");
  }

  const addUser = async (username) => {
    // alert(username);
    try {
      const response = await fetch('https://chatapp-dt22.onrender.com/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });
      const data = await response.json();
      console.log('User added:', data);
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-black">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg animate-fadeIn">
        <h1 className="text-3xl font-bold text-center text-gray-800">Signup</h1>
        <div className="space-y-4">
          <input
            onChange={handleInputChangeone}
            value={username}
            type="email"
            placeholder="E-mail"
            required
            className="w-full px-4 py-2 text-lg text-gray-800 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            onChange={handleInputChangetwo}
            value={password}
            type="password"
            placeholder="Password"
            required
            className="w-full px-4 py-2 text-lg text-gray-800 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            onChange={handleInputChangethree}
            value={cpassword}
            type="password"
            placeholder="Confirm Password"
            required
            className="w-full px-4 py-2 text-lg text-gray-800 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="justify-center py-2">
          <button
            onClick={() => {
              handleSubmit();
              addUser(username); // Pass the username here
            }} 
            className="w-full py-2 my-2 text-lg font-semibold text-white transition duration-500 transform bg-indigo-600 rounded-lg hover:bg-indigo-700 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300"
          >
            Register Now !!!
          </button>
          
          <button
            onClick={() => {
              signupnav();
             // Pass the username here
            }} 
            className="w-full py-2 my-2 text-lg font-semibold text-white transition duration-500 transform bg-indigo-600 rounded-lg hover:bg-indigo-700 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300"
          >
           Already have an account kindly login !!!
          </button>
        </div>
      </div>
    </div>
  );
};

export default Signup;
