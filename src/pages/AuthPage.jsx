// 🌐 React Core
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

// 💫 Animation
import { motion, AnimatePresence } from "framer-motion";

import { Button, Input, Modal } from "../components/ui";
import { Globe } from "lucide-react";


function AuthPage({ onNavigate }) {
  const { login, register, skipLogin } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [departmentCode, setDepartmentCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLoginMode) {
        await login(email, password);
      } else {
        let role = "user";
        let deptId = null;
        if (departmentCode === "super999") {
          role = "super_admin";
          deptId = "Super Admin";
        } else if (departmentCode) {
          role = "authority";
          deptId = departmentCode;
        }

        await register({
          firstName,
          lastName,
          email,
          password,
          mobile,
          role,
          departmentId: deptId
        });
      }
    } catch (err) {
      // Enhanced error handling to display detailed server messages
      const errorMessage = err.response && err.response.data && err.response.data.msg
        ? err.response.data.msg
        : err.message || "An unexpected error occurred. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-300"></div>
      </div>

      {/* Error Modal */}
      <Modal show={!!error} onClose={() => setError(null)} title="Authentication Error" type="error">
        <p className="text-sm text-slate-300">{error}</p>
      </Modal>

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        whileHover={{ scale: 1.01 }}
        className="relative z-10 w-full max-w-md p-8 rounded-2xl backdrop-blur-2xl bg-white/10 border border-white/20 shadow-[0_0_40px_rgba(56,189,248,0.15)] overflow-visible"
      >
         {/* Header */}
        <div className="flex flex-col items-center text-center mb-6 relative z-10">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Globe className="h-10 w-10 text-cyan-400 drop-shadow-md" />
          </motion.div>

          <motion.h2 className="mt-4 text-3xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            {isLoginMode ? "Welcome Back" : "Create Account"}
          </motion.h2>

          <p className="text-slate-400 text-sm mt-2">
            {isLoginMode
              ? "Access your grievance dashboard"
              : "Join our civic problem-solving platform"}
          </p>
        </div>

        {/* Form */}
        <motion.form
          key={isLoginMode ? "loginForm" : "signupForm"}
          className="space-y-5 relative z-10 overflow-visible"
          onSubmit={handleSubmit}
        >
          <AnimatePresence mode="wait">
            {!isLoginMode && (
              <motion.div
                key="signupFields"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="flex gap-3">
                  <Input 
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                  <Input 
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>

                <Input 
                  type="tel"
                  placeholder="Mobile Number (optional)"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />

                <Input 
                  type="password"
                  placeholder="Authority / Super Admin Code (optional)"
                  value={departmentCode}
                  onChange={(e) => setDepartmentCode(e.target.value)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Common Inputs */}
          <Input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.03 }}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-semibold shadow-lg shadow-cyan-500/20 transition-all duration-300"
          >
            {loading
              ? "Processing..."
              : isLoginMode
              ? "Sign In"
              : "Register"}
          </motion.button>

          {/* Skip Button */}
            <motion.button
                type="button"
                onClick={skipLogin}
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.03 }}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-slate-600 to-gray-700 hover:from-slate-500 hover:to-gray-600 text-white font-semibold shadow-lg shadow-gray-500/20 transition-all duration-300"
            >
                Skip
            </motion.button>

          {/* Toggle Mode */}
          <p className="text-sm text-center text-slate-400 mt-3">
            {isLoginMode ? "New here?" : "Already have an account?"}{" "}
            <span
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="text-cyan-400 hover:text-cyan-300 cursor-pointer"
            >
              {isLoginMode ? "Create one" : "Sign in"}
            </span>
          </p>
        </motion.form>
      </motion.div>
    </div>
  );
}

export default AuthPage;
