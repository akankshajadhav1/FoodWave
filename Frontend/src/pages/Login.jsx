import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UtensilsCrossed, ArrowRight } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      setSubmitting(true);
      const user = await login(email, password);
      if (user.role === "admin" || user.role === "restaurant_owner") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[#FFFDF7]">
      <div className="max-w-md w-full bg-[#FFFDF7] rounded-3xl p-8 border border-[#F0EAF8] shadow-xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#B85C3B] rounded-2xl flex items-center justify-center text-[#B9A7E0] mx-auto shadow-lg shadow-[#B85C3B]/20 mb-3">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-[#292329]">Welcome Back</h2>
          <p className="text-xs text-[#292329]/60 font-medium mt-1">
            Sign in to continue ordering your favorite food
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-xs font-semibold p-3.5 rounded-xl mb-4 text-center border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#292329] uppercase">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="akanksha@gmail.com"
              className="w-full mt-1 p-3.5 bg-[#F0EAF8] border border-[#B9A7E0]/40 rounded-xl text-sm text-[#292329] focus:outline-none focus:border-[#B85C3B]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#292329] uppercase">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full mt-1 p-3.5 bg-[#F0EAF8] border border-[#B9A7E0]/40 rounded-xl text-sm text-[#292329] focus:outline-none focus:border-[#B85C3B]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#B85C3B] hover:bg-[#B85C3B]/90 text-[#FFFDF7] font-bold py-3.5 rounded-xl shadow-lg shadow-[#B85C3B]/20 flex items-center justify-center space-x-2 transition"
          >
            <span>{submitting ? "Signing in..." : "Sign In"}</span>
            <ArrowRight className="w-4 h-4 text-[#B9A7E0]" />
          </button>
        </form>

        <p className="text-xs text-[#292329]/60 text-center mt-6 font-medium">
          Don't have an account?{" "}
          <Link to="/register" className="text-[#B85C3B] font-bold hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
