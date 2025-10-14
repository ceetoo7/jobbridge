import { useState, useContext } from "react";
import API from "../api/axios";
import AuthContext from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const { dispatch } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "worker",
    skills: "",
    expectedRate: "",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, skills: formData.skills.split(",") };
      const res = await API.post("/auth/register", payload);
      dispatch({ type: "LOGIN", payload: res.data });
      navigate("/dashboard");
    } catch (err) {
      alert(err.response.data.message);
    }
  };

  return (
    <div className="flex justify-center mt-10">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-96"
      >
        <h2 className="text-2xl mb-4">Register</h2>
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          className="w-full mb-2 p-2 border rounded"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full mb-2 p-2 border rounded"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="w-full mb-2 p-2 border rounded"
          required
        />
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full mb-2 p-2 border rounded"
        >
          <option value="worker">Worker</option>
          <option value="employer">Employer</option>
        </select>
        {formData.role === "worker" && (
          <>
            <input
              type="text"
              name="skills"
              placeholder="Skills (comma separated)"
              value={formData.skills}
              onChange={handleChange}
              className="w-full mb-2 p-2 border rounded"
            />
            <input
              type="number"
              name="expectedRate"
              placeholder="Expected Rate"
              value={formData.expectedRate}
              onChange={handleChange}
              className="w-full mb-2 p-2 border rounded"
            />
          </>
        )}
        <button
          type="submit"
          className="bg-blue-600 text-white w-full py-2 rounded mt-2"
        >
          Register
        </button>
      </form>
    </div>
  );
};

export default Register;
