import { useContext } from "react";
import AuthContext from "../context/AuthContext";

const Navbar = () => {
  const { state, dispatch } = useContext(AuthContext);

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
  };

  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between">
      <div className="font-bold text-lg">JobBridge Nepal</div>
      <div>
        {state.user ? (
          <>
            <span className="mr-4">{state.user.name}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 px-2 py-1 rounded"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <a href="/login" className="mr-4">
              Login
            </a>
            <a href="/register">Register</a>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
