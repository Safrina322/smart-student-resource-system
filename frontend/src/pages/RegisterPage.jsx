// import { useState } from "react";
// import "../styles/LoginPage.css";
// import { Link } from "react-router-dom";


// function LoginPage() {
//   const [pwd1, setPwd1] = useState("");
//   const [pwd2, setPwd2] = useState("");
//   const [same, setSame] = useState(true);

//   function handlePwd1Change(event) {
//     setPwd1(event.target.value);
//   }

//   function handlePwd2Change(event) {
//     setPwd2(event.target.value);
//     setSame(pwd1 === event.target.value);
//   }

//   return (
//     <div className="login-page">
//       <form className="login-form">
//         <h2>Create Account</h2>

//         <div className="mb-3">
//           <label className="form-label">Username</label>
//           <input type="text" className="form-control" />
//         </div>

//         <div className="mb-3">
//           <label className="form-label">Email address</label>
//           <input type="email" className="form-control" />
//         </div>

//         <div className="mb-3">
//           <label className="form-label">Password</label>
//           <input
//             type="password"
//             className="form-control"
//             value={pwd1}
//             onChange={handlePwd1Change}
//           />
//         </div>

//         <div className="mb-3">
//           <label className="form-label">Re-enter Password</label>
//           <input
//             type="password"
//             className="form-control"
//             value={pwd2}
//             onChange={handlePwd2Change}
//           />
//         </div>

//         {!same && <p className="password-error">Passwords do not match!</p>}

//         <div className="mb-3 form-check">
//           <input type="checkbox" className="form-check-input" />
//           <label className="form-check-label">I Agree</label>
//         </div>

//         <button type="submit" className="btn btn-primary">
//           Create an Account
//         </button>
//         <p className="switch-auth">
//   Already have an account?{" "}
//   <Link to="/already">Login</Link>

// </p>

//       </form>
//     </div>
//   );
// }

// export default LoginPage;

import { useState } from "react";
import "../styles/LoginPage.css";
import { Link, useNavigate } from "react-router-dom";

function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      // ✅ Registration success → go to login
      navigate("/login");
    } catch (err) {
      setError("Server error. Try again later.");
    }
  };

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleRegister}>
        <h2>Create Account</h2>

        {error && <p className="password-error">{error}</p>}

        <div className="mb-3">
          <label className="form-label">Username</label>
          <input
            type="text"
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Email address</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Re-enter Password</label>
          <input
            type="password"
            className="form-control"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary">
          Create an Account
        </button>

        <p className="switch-auth">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}

export default RegisterPage;
