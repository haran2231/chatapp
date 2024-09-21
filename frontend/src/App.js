import './App.css';
import { BrowserRouter as Router, Link, Route, Routes } from 'react-router-dom';
import Home from './Components/Home';
import Login from './Components/Login';
import Signup from './Components/Signup';


function App() {
  return (
    <Router>
      <>
      <nav>
        <ul>
          {/* <Link to={'/login'}>Login</Link>
          <Link to={'/signup'}>SignUp</Link> */}
        </ul>
      </nav>
        <Routes>
          <Route path='/' Component={Login} />
          <Route exact path="/home" Component={Home} />
          <Route exact path="/login" Component={Login} />
          <Route exact path="/signup" Component={Signup} />
        </Routes>
      </>
    </Router>

  );
}

export default App;
