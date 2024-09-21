import { signInWithEmailAndPassword } from "firebase/auth";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {auth} from "../config";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    auth.onAuthStateChanged(function (username) {
      if (username) {
        navigate("/home");
      } else {
        navigate("/login");
      }
    });
  }, [navigate]);

  // Function to handle input changes
  const handleInputChangeone = (e) => {
    setUsername(e.target.value);
  };

  const handleInputChangetwo = (e) => {
    setPassword(e.target.value);
  };

  const signupnav = () =>{
    navigate("/signup");
  }

  // Function to handle form submission
  const handleSubmit = () => {
    signInWithEmailAndPassword(auth, username, password)
      .then(() => {
        console.log("User logged in");
        // alert("Success");
        navigate("/home");
      })
      .catch(() => {
        console.log("incorrect username");
        alert("Incorrect");
      });
  };

  return (
    <div className="flex items-center justify-center h-screen bg-black">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg animate-fadeIn">
        <h1 className="text-3xl font-bold text-center text-gray-800">Login</h1>
        <div className="space-y-4">
          <input
            onChange={handleInputChangeone}
            value={username}
            type="text"
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
        </div>
        <div>
            <p className="text-center text-red-700">If You forget the password. Kindly contact haran2231@gmail.com to reset you password. I will send password reset link to your mail.</p>
        </div>
        <div className="justify-center py-2">
          <button
            onClick={handleSubmit}
            className="w-full py-2 my-2 text-lg font-semibold text-white transition duration-500 transform bg-indigo-600 rounded-lg hover:bg-indigo-700 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300"
          >
            Login Now !!!
          </button>
          <button
            onClick={signupnav}
            className="w-full py-2 my-2 text-lg font-semibold text-white transition duration-500 transform bg-indigo-600 rounded-lg hover:bg-indigo-700 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300"
          >
            Register Account !!!
          </button>
        </div>
      </div>
    </div>
  );
};

export default Signup;
