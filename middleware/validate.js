const validateNewUser = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name) errors.push("Name is required");

  if (!email) {
    errors.push("Please enter an email");
  } else if (!validateEmail(email)) {
    errors.push("Invalid email format");
  }

  if (!password) {
    errors.push("Password is required");
  } else if (
    !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/.test(
      password,
    )
  ) {
    errors.push(
      "Password must contain uppercase, lowercase, number, and special character",
    );
  }

  if (errors.length > 0) {
    console.log("Validation errors (New User):", errors);
    return res.status(400).json({ message: errors });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email) {
    errors.push("Enter your email");
  } else if (!validateEmail(email)) {
    errors.push("Enter a valid email");
  }

  if (!password) {
    errors.push("Please enter your password");
  }

  if (errors.length > 0) {
    console.log("Validation errors (Login):", errors);
    return res.status(400).json({ message: errors });
  }

  next();
};

const validatePassword = (req, res, next) => {
  const { password } = req.body;
  const errors = [];

  if (!password) {
    errors.push("Enter your password");
  } else if (
    !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/.test(
      password,
    )
  ) {
    errors.push(
      "Password must contain uppercase, lowercase, number, and special character",
    );
  }

  if (errors.length > 0) {
    console.log("Validation errors (Password):", errors);
    return res.status(400).json({ message: errors });
  }

  next();
};

function validateEmail(email) {
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  return emailRegex.test(String(email).toLowerCase());
}

module.exports = {
  validateNewUser,
  validateLogin,
  validatePassword,
};
