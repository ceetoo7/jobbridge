import { useContext } from "react";
import AuthContext from "../context/AuthContext";

const Dashboard = () => {
  const { state } = useContext(AuthContext);

  if (!state.user) return <div className="text-center mt-10">Please login</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Welcome, {state.user.name}</h1>
      <p>Role: {state.user.role}</p>
      {state.user.role === "worker" && (
        <>
          <p>Skills: {state.user.skills.join(", ")}</p>
          <p>Expected Rate: {state.user.expectedRate}</p>
        </>
      )}
    </div>
  );
};

export default Dashboard;
